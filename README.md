# 📚 BrightLearn: AI-Powered Learning Management System (LMS)  

An intuitive **Learning Management System for K-12 education** with built-in **AI insights**. Teachers can create quizzes, students can attempt them, and the system generates **AI-driven recommendations** to guide teaching strategies.  

---

## ✨ Features  
- 👩‍🏫 **Teacher Dashboard**  
  - Create, list, and delete quizzes  
  - View student submissions  
  - Generate **AI-powered insights**  

- 🧑‍🎓 **Student Dashboard (basic)**  
  - Attempt quizzes  
  - Get instant feedback (score, correct/incorrect answers)  

- 🤖 **AI-Generated Insights**  
  - Class performance overview (avg, highest, lowest, distribution)   
  - Actionable teaching recommendations using **Phi-3-mini (High CPU, High RAM)**, **flan-t5-base (Low CPU)**

- ⚡ **Tech Stack**  
  - Backend → **FastAPI** + Python  
  - Frontend → **React + Tailwind CSS**  
  - AI → **Microsoft Phi-3-mini (Hugging Face Transformers)**  

## 📌 Notes
  - By default, for low CPU and low RAM systems, use **flan-t5-base**. The first run will download the model
  - For more accurate AI insights, use **Phi-3-mini via Hugging Face** Transformers (**requires 20-25 GBs of RAM + GPU Check ```utils/ai.py```**) 
  - Model takes time to execute as running locally
  - Teacher and Student Login are dummy data
  - Project developed for 1 subject (Math), 1 teacher (Smith), multiple students (Alice, Bob, Champak) 
  - All data (quizzes, submissions, insights) are stored as JSON files inside backend/data/
---

## 🚀 Getting Started  

### 🛠️ Requirements
  - Python 3.9+
  - Node.js 18+
  - pip

### Clone the Repo  
```bash
git clone https://github.com/VishvKaneria/dynamic-active-lms.git
cd ai-lms
```

### Install backend requirements:
``` bash
cd backend
pip install -r requirements.txt
```

### Install frontend requirements:
``` bash
cd frontend
npm install
```

---

## 🎞️ Demo:
https://github.com/user-attachments/assets/91c96128-d3e1-4e10-8f8f-f1b659112373

<img width="2634" height="1100" alt="image" src="https://github.com/user-attachments/assets/0871dbb7-40f6-4ce6-b5e9-bd5f5198b506" />
