import { useEffect, useState, useCallback } from "react";
import QuizModal from "./QuizModal";
import { useNavigate } from "react-router-dom";

interface Quiz {
  id: number;
  title: string;
  subject: string;
}

interface Result {
  student_id: string;
  quiz_id: number;
  attempt: number;
  score: number;
  total: number;
}

export default function StudentDashboard() {
  const studentId = localStorage.getItem("name") || "Student";
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState<{ id: number; title: string } | null>(null);

  const navigate = useNavigate();

  // fetch all quizzes + results
  const loadData = useCallback(async () => {
    try {
      const [quizRes, resultRes] = await Promise.all([
        fetch("http://127.0.0.1:8000/teacher/quiz"),
        fetch(`http://127.0.0.1:8000/student/${studentId}/results`),
      ]);

      const quizData = await quizRes.json();
      const resultData = await resultRes.json();

      setQuizzes(quizData);
      setResults(resultData);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const hasAttempted = (quizId: number) =>
    results.some((r) => r.quiz_id === quizId && r.student_id === studentId);

  const getScore = (quizId: number) => {
    const result = results.find((r) => r.quiz_id === quizId && r.student_id === studentId);
    return result ? `${result.score}/${result.total}` : "";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white text-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600">
        Loading quizzes...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold mb-6">
          🧑‍🎓 {studentId}'s Dashboard
        </h1>
        <button
          onClick={() => {
            localStorage.clear();
            navigate("/");
          }}
          className="bg-white text-red-600 font-semibold px-4 py-2 rounded shadow hover:bg-red-50 border border-red-500" >
          Logout
        </button>
      </div>
      
      <p className="mb-10 text-lg opacity-90">Take quizzes and track your results.</p>

      <div className="grid md:grid-cols-2 gap-6">
        {quizzes.map((quiz) => (
          <div
            key={quiz.id}
            className="p-6 rounded-xl bg-white text-gray-800 shadow-lg hover:scale-105 transform transition"
          >
            <h2 className="text-xl font-bold">{quiz.title}</h2>
            <p className="text-sm text-gray-600">Subject: {quiz.subject}</p>

            {hasAttempted(quiz.id) ? (
              <p className="mt-4 text-green-700 font-semibold">
                Already Attempted (Score: {getScore(quiz.id)})
              </p>
            ) : (
              <button
                className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700"
                onClick={() => setSelectedQuiz({ id: quiz.id, title: quiz.title })}
              >
                Start Quiz
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Quiz Modal */}
      {selectedQuiz && (
        <QuizModal
          quizId={selectedQuiz.id}
          quizTitle={selectedQuiz.title}
          studentId={studentId}
          onClose={() => setSelectedQuiz(null)}
          onSubmitted={loadData} // refresh results after quiz submit
        />
      )}
    </div>
  );
}
