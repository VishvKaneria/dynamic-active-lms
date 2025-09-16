import re, os, json
from fastapi import APIRouter
from pydantic import BaseModel
from utils.file_utils import load_file, save_file
from fastapi import HTTPException
from utils.ai import generate_ai_summary

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

    # --- Class Performance ---
    scores = [s["score"] for s in submissions]
    total_students = len(submissions)
    avg_score = sum(scores) / total_students
    highest = max(scores)
    lowest = min(scores)

    score_distribution = {
        "full_marks": sum(1 for s in submissions if s["score"] == len(quiz["questions"])),
        "zero": sum(1 for s in submissions if s["score"] == 0),
        "partial": sum(1 for s in submissions if 0 < s["score"] < len(quiz["questions"]))
    }

    # --- Question-Level ---
    question_stats = []
    for i, q in enumerate(quiz["questions"]):
        correct_count = sum(1 for s in submissions if i < len(s["answers"]) and s["answers"][i] == q["answer"])
        correct_rate = (correct_count / total_students) * 100
        wrong_answers = {}
        for s in submissions:
            if i < len(s["answers"]) and s["answers"][i] != q["answer"]:
                ans = s["answers"][i]
                wrong_answers[ans] = wrong_answers.get(ans, 0) + 1
        most_common_wrong = max(wrong_answers, key=wrong_answers.get) if wrong_answers else None

        question_stats.append({
            "q": q["q"],
            "answer": q["answer"],
            "correct_rate": correct_rate,
            "most_common_wrong": most_common_wrong
        })

    # --- Build summary text for AI ---
    hardest = sorted(question_stats, key=lambda q: q["correct_rate"])[:2]
    hardest_text = ", ".join([f"{q['q']} ({q['correct_rate']:.0f}% correct)" for q in hardest])
    misconceptions = [f"{q['q']} → {q['most_common_wrong']}" for q in question_stats if q["most_common_wrong"]]

    summary_text = f"""
    Class average: {avg_score:.1f}/{len(quiz['questions'])}
    Highest: {highest}, Lowest: {lowest}
    Hardest questions: {hardest_text if hardest_text else 'None'}
    Common misconceptions: {', '.join(misconceptions) if misconceptions else 'None'}
    """

    prompt = f"""
    ### START_PROMPT
    You are an expert K-12 math teacher coach. Based on this quiz data, write a clear, supportive narrative (1–2 short paragraphs) that helps the teacher understand class performance and what to do next.

    Class average: {avg_score:.1f}/{len(quiz['questions'])}
    Highest: {highest}, Lowest: {lowest}
    Hardest questions: {hardest_text if hardest_text else 'None'}
    Common misconceptions: {', '.join(misconceptions) if misconceptions else 'None'}

    Start directly with the insights. 
    Do not echo the quiz data. 
    Do not include greetings (like 'Dear Teacher') or closings (like 'Best,').
    ### END_PROMPT
    """

    ai_result = generate_ai_summary(prompt)

    return {
        "analytics": {
            "class_overview": {
                "total_students": total_students,
                "average_score": avg_score,
                "highest": highest,
                "lowest": lowest,
                "score_distribution": score_distribution
            },
            "question_analysis": question_stats
        },
        "ai_insights": ai_result
    }