import re, os
from fastapi import APIRouter
from pydantic import BaseModel
from utils.file_utils import load_file, save_file

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