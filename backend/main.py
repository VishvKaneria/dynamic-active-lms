from fastapi import FastAPI
from routes import teacher, student

app = FastAPI()

# include teacher & student routes
app.include_router(teacher.router, prefix="/teacher", tags=["Teacher"])
app.include_router(student.router, prefix="/student", tags=["Student"])

@app.get("/")
def home():
    return {"message": "LMS Backend is running 🚀"}
