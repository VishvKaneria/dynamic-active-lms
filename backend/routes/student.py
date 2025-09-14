import re, os
from fastapi import APIRouter
from pydantic import BaseModel
from utils.file_utils import load_file, save_file

router = APIRouter()

QUIZ_FOLDER = "data/Quizzes"
SUBMISSION_FOLDER = "data/Submissions"

def make_safe_filename(name: str, prefix: str) -> str:
    safe_name = re.sub(r'[^a-zA-Z0-9_]', '', name.replace(" ", "_").lower())
    return f"{prefix}_{safe_name}.json"

class Submission(BaseModel):
    student_id: str
    answers: list[str]

@router.get("/quiz/{quiz_id}/{quiz_title}")
def get_quiz(quiz_id: int, quiz_title: str):
    quiz_file = os.path.join(QUIZ_FOLDER, make_safe_filename(f"{quiz_id}_{quiz_title}", "quiz"))
    if not os.path.exists(quiz_file):
        return {"error": "Quiz not found"}
    
    quiz = load_file(quiz_file)
    sanitized = {
        "id": quiz["id"],
        "title": quiz["title"],
        "subject": quiz["subject"],
        "questions": [
            {"q": q["q"], "options": q["options"]}
            for q in quiz["questions"]
        ]
    }
    return sanitized

@router.post("/quiz/{quiz_id}/{quiz_title}/submit")
def submit_quiz(quiz_id: int, quiz_title: str, submission: Submission):
    quiz_file = os.path.join(QUIZ_FOLDER, make_safe_filename(f"{quiz_id}_{quiz_title}", "quiz"))
    
    if not os.path.exists(quiz_file):
        return {"error": "Quiz not found"}

    quiz = load_file(quiz_file)

    # auto-grading
    score, feedback = 0, []
    for i, question in enumerate(quiz["questions"]):
        student_answer = submission.answers[i] if i < len(submission.answers) else None
        is_correct = student_answer == question["answer"]
        if is_correct:
            score += 1
        feedback.append({
            "question": question["q"],
            "student_answer": student_answer,
            "is_correct": is_correct
        })

    # store submission
    submission_file = os.path.join(SUBMISSION_FOLDER, make_safe_filename(f"{quiz_id}_{quiz['title']}", "submissions"))
    submissions = load_file(submission_file)

    past_attempts = [s for s in submissions if s["student_id"] == submission.student_id]
    attempt_number = len(past_attempts) + 1

    sub_record = {
        "student_id": submission.student_id,
        "attempt": attempt_number,
        "answers": submission.answers,
        "score": score,
        "total": len(quiz["questions"]),
        "feedback": feedback
    }

    submissions.append(sub_record)
    save_file(submission_file, submissions)

    return sub_record

@router.get("/{student_id}/results")
def get_student_results(student_id: str):
    all_results = []

    # loop over all submission files
    for file in os.listdir(SUBMISSION_FOLDER):
        if file.endswith(".json"):
            submissions = load_file(os.path.join(SUBMISSION_FOLDER, file))
            # filter by student_id
            student_subs = [s for s in submissions if s["student_id"] == student_id]
            all_results.extend(student_subs)

    return all_results