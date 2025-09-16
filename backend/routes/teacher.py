import re, os
from fastapi import APIRouter
from pydantic import BaseModel
from utils.file_utils import load_file, save_file
from fastapi import HTTPException
from utils.ai import generate_ai_summary
from collections import Counter

router = APIRouter()

QUIZ_FOLDER = "data/Quizzes"
SUBMISSION_FOLDER = "data/Submissions"

os.makedirs(QUIZ_FOLDER, exist_ok=True)
os.makedirs(SUBMISSION_FOLDER, exist_ok=True)

def make_safe_filename(name: str, prefix: str) -> str:
    safe_name = re.sub(r'[^a-zA-Z0-9_]', '', name.replace(" ", "_").lower())
    return f"{prefix}_{safe_name}.json"

class Question(BaseModel):
    q: str
    options: list[str]
    answer: str

class Quiz(BaseModel):
    subject: str
    title: str
    questions: list[Question]

@router.post("/quiz")
def create_quiz(quiz: Quiz):
    # Assign unique ID (incremental)
    existing_quizzes = os.listdir(QUIZ_FOLDER)
    quiz_id = len(existing_quizzes) + 1

    # safe filenames with ID
    quiz_file = os.path.join(QUIZ_FOLDER, make_safe_filename(f"{quiz_id}_{quiz.title}", "quiz"))
    submission_file = os.path.join(SUBMISSION_FOLDER, make_safe_filename(f"{quiz_id}_{quiz.title}", "submissions"))

    # save quiz file
    quiz_data = quiz.dict()
    quiz_data["id"] = quiz_id
    save_file(quiz_file, quiz_data)

    # prepare submission file
    if not os.path.exists(submission_file):
        save_file(submission_file, [])

    return {
        "message": "Quiz created",
        "quiz_id": quiz_id,
        "quiz_file": quiz_file.replace("\\", "/"),
        "submission_file": submission_file.replace("\\", "/")
    }

@router.get("/quiz")
def list_quizzes():
    quizzes = []
    for file in os.listdir(QUIZ_FOLDER):
        if file.endswith(".json"):
            quiz = load_file(os.path.join(QUIZ_FOLDER, file))
            quizzes.append({
                "id": quiz["id"],
                "title": quiz["title"],
                "subject": quiz["subject"]
            })
    return quizzes

@router.get("/quiz/{quiz_id}/{quiz_title}/submissions")
def get_quiz_submissions(quiz_id: int, quiz_title: str):
    submission_file = os.path.join(SUBMISSION_FOLDER, make_safe_filename(f"{quiz_id}_{quiz_title}", "submissions"))

    if not os.path.exists(submission_file):
        return {"error": f"No submissions found for quiz '{quiz_title}'"}

    submissions = load_file(submission_file)
    return {
        "quiz_id": quiz_id,
        "quiz_title": quiz_title,
        "total_submissions": len(submissions),
        "submissions": submissions
    }

@router.delete("/quiz/{quiz_id}")
def delete_quiz(quiz_id: int):
    # find quiz file
    files = os.listdir(QUIZ_FOLDER)
    target_file = None
    for file in files:
        if file.startswith(f"quiz_{quiz_id}_") and file.endswith(".json"):
            target_file = os.path.join(QUIZ_FOLDER, file)
            break

    if not target_file:
        raise HTTPException(status_code=404, detail="Quiz not found")

    # remove quiz file
    os.remove(target_file)

    # remove submissions file if exists
    sub_file = None
    for file in os.listdir(SUBMISSION_FOLDER):
        if file.startswith(f"submissions_{quiz_id}_") and file.endswith(".json"):
            sub_file = os.path.join(SUBMISSION_FOLDER, file)
            break
    if sub_file and os.path.exists(sub_file):
        os.remove(sub_file)

    return {"message": f"Quiz {quiz_id} deleted successfully"}

@router.get("/quiz/{quiz_id}/{quiz_title}/insights")
def quiz_insights(quiz_id: int, quiz_title: str):
    submission_file = os.path.join(SUBMISSION_FOLDER, make_safe_filename(f"{quiz_id}_{quiz_title}", "submissions"))
    quiz_file = os.path.join(QUIZ_FOLDER, make_safe_filename(f"{quiz_id}_{quiz_title}", "quiz"))

    if not os.path.exists(submission_file) or not os.path.exists(quiz_file):
        raise HTTPException(status_code=404, detail="Quiz or submissions not found")

    submissions = load_file(submission_file)
    quiz = load_file(quiz_file)

    if len(submissions) == 0:
        return {"analytics": {}, "ai_insights": "⚠️ No student submissions yet."}

    # --- Compute Class Performance ---
    scores = [s["score"] for s in submissions]
    total_students = len(submissions)
    avg_score = sum(scores) / total_students
    highest = max(scores)
    lowest = min(scores)

    # --- Question-Level Analysis ---
    question_stats = []
    question_breakdown_lines = []
    for i, q in enumerate(quiz["questions"]):
        correct_count = sum(1 for s in submissions if i < len(s["answers"]) and s["answers"][i] == q["answer"])
        total_attempts = len(submissions)
        correct_rate = (correct_count / total_attempts) * 100

        wrong_answers = {}
        for s in submissions:
            if i < len(s["answers"]) and s["answers"][i] != q["answer"]:
                ans = s["answers"][i]
                wrong_answers[ans] = wrong_answers.get(ans, 0) + 1
        most_common_wrong = max(wrong_answers, key=wrong_answers.get) if wrong_answers else None

        question_stats.append({
            "q": q["q"],
            "correct_rate": correct_rate,
            "most_common_wrong": most_common_wrong
        })
        question_breakdown_lines.append(
            f"Q{i+1}: {q['q']} | Correct Rate: {correct_rate:.1f}% | Common Mistake: {most_common_wrong}"
        )

    # --- Prompt for AI ---
    prompt = f"""
    You are an educational consultant helping a teacher understand quiz results. 
    Do not just repeat the scores. Instead, analyze what these results mean about student understanding, 
    highlight likely misconceptions, and give specific teaching recommendations. 

    Quiz Title: {quiz_title}
    Total Students: {total_students}
    Average Score: {avg_score:.2f}/{len(quiz['questions'])}
    Highest: {highest}, Lowest: {lowest}

    Question Results:
    {chr(10).join(question_breakdown_lines)}

    Now write a teacher-friendly report that includes:
    - What these results say about overall student understanding.
    - What misconceptions the wrong answers suggest.
    - Whether the quiz was fair or too difficult.
    - What teaching strategies the teacher should use next class.
    """

    try:
        ai_text = generate_ai_summary(prompt).strip()
    except Exception as e:
        ai_text = f"⚠️ AI model error: {str(e)}"

    return {
        "analytics": {
            "class_overview": {
                "total_students": total_students,
                "average_score": avg_score,
                "highest": highest,
                "lowest": lowest,
            },
            "question_analysis": question_stats
        },
        "ai_insights": ai_text
    }