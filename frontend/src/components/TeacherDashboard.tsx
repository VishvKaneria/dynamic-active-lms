import { useEffect, useState } from "react";
import QuizForm from "./QuizForm";
import SubmissionsModal from "./SubmissionsModal";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

interface Quiz {
  id: number;
  title: string;
  subject: string;
}

interface InsightsQuiz {
  id: number;
  title: string;
  analytics?: {
    class_overview: {
      total_students: number;
      average_score: number;
      highest: number;
      lowest: number;
      score_distribution: {
        full_marks: number;
        zero: number;
        partial: number;
      };
    };
    question_analysis: {
      q: string;
      answer: string;
      correct_rate: number;
      most_common_wrong: string | null;
    }[];
    student_feedback: {
      student_id: string;
      score: number;
      total: number;
      accuracy_rate: number;
      wrong_answers: string[];
    }[];
  };
}

export default function TeacherDashboard() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<{ id: number; title: string } | null>(null);
  const [insights, setInsights] = useState<any | null>(null);
  const [insightsQuiz, setInsightsQuiz] = useState<InsightsQuiz | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const navigate = useNavigate();

  const fetchQuizzes = () => {
    fetch("http://127.0.0.1:8000/teacher/quiz")
      .then((res) => res.json())
      .then((data) => setQuizzes(data))
      .catch((err) => console.error("Error fetching quizzes:", err));
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchInsights = async (quizId: number, quizTitle: string) => {
    try {
      setLoadingInsights(true);
      setInsights(null);
      setInsightsQuiz(null);

      const res = await fetch(
        `http://127.0.0.1:8000/teacher/quiz/${quizId}/${quizTitle}/insights`
      );
      const data = await res.json();
      console.log("INSIGHTS RESPONSE:", data);

      setInsights(data.ai_insights || null);
      setInsightsQuiz({
        id: quizId,
        title: quizTitle,
        analytics: data.analytics,
      });

      toast.success("Insights generated ✅");
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch insights ❌");
    } finally {
    setLoadingInsights(false);
  }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold flex items-center gap-2">
          👩‍🏫 Teacher Dashboard
        </h1>
        <button
          onClick={() => {
            localStorage.clear();
            navigate("/");
          }}
          className="bg-white text-red-600 font-semibold px-4 py-2 rounded shadow hover:bg-red-50 border border-red-500"
        >
          Logout
        </button>
      </div>

      <p className="mb-10 text-lg opacity-90">
        Manage your quizzes and track student progress.
      </p>

      {/* Create Quiz Button */}
      <button
        onClick={() => setShowForm(true)}
        className="mb-8 px-6 py-3 rounded-xl bg-white text-indigo-700 font-semibold shadow-lg hover:bg-indigo-100 hover:scale-105 transform transition"
      >
        ➕ Create New Quiz
      </button>

      {/* Quiz List */}
      <div className="grid md:grid-cols-4 gap-6">
        {quizzes.map((quiz) => (
          <div
            key={quiz.id}
            className="p-6 rounded-xl bg-white text-gray-800 shadow-lg hover:scale-105 transform transition"
          >
            <h2 className="text-xl font-bold">{quiz.title}</h2>
            <p className="text-sm text-gray-600">Subject: {quiz.subject}</p>

            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={() => setSelectedQuiz({ id: quiz.id, title: quiz.title })}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700"
              >
                View Submissions
              </button>

              <button
                onClick={() => fetchInsights(quiz.id, quiz.title)}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700"
              >
                Generate Insights
              </button>

              <button
                onClick={async () => {
                  if (window.confirm(`Are you sure you want to delete "${quiz.title}"?`)) {
                    const res = await fetch(
                      `http://127.0.0.1:8000/teacher/quiz/${quiz.id}`,
                      { method: "DELETE" }
                    );
                    if (res.ok) {
                      toast.success("Quiz deleted ✅");
                      fetchQuizzes();
                    } else {
                      toast.error("Failed to delete quiz ❌");
                    }
                  }
                }}
                className="px-4 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Quiz Form Modal */}
      {showForm && (
        <QuizForm onClose={() => setShowForm(false)} onQuizCreated={fetchQuizzes} />
      )}

      {/* Submissions Modal */}
      {selectedQuiz && (
        <SubmissionsModal
          quizId={selectedQuiz.id}
          quizTitle={selectedQuiz.title}
          onClose={() => setSelectedQuiz(null)}
        />
      )}

      {/* Loading Modal */}
      {loadingInsights && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white text-gray-900 rounded-lg p-6 shadow-lg flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600 border-solid mb-4"></div>
            <p className="font-semibold">Generating AI Insights...</p>
          </div>
        </div>
      )}

      {/* Insights Modal */}
      {insightsQuiz && !loadingInsights && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4">
          <div className="bg-white text-gray-900 rounded-lg w-full max-w-4xl shadow-lg p-6 overflow-y-auto max-h-[80vh]">
            <h2 className="text-2xl font-bold mb-4">
              🧠 AI Insights – {insightsQuiz.title}
            </h2>

            {/* Class Performance */}
            {insightsQuiz.analytics && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">📊 Class Performance</h3>
                <p>Total Students: {insightsQuiz.analytics.class_overview.total_students}</p>
                <p>Average Score: {insightsQuiz.analytics.class_overview.average_score.toFixed(2)}</p>
                <p>Highest Score: {insightsQuiz.analytics.class_overview.highest}</p>
                <p>Lowest Score: {insightsQuiz.analytics.class_overview.lowest}</p>
                <p>
                  Score Distribution → ✅ Full: {insightsQuiz.analytics.class_overview.score_distribution.full_marks}, 
                  ⚠️ Partial: {insightsQuiz.analytics.class_overview.score_distribution.partial}, 
                  ❌ Zero: {insightsQuiz.analytics.class_overview.score_distribution.zero}
                </p>
              </div>
            )}

            {/* Question Analysis */}
            {/*
            {insightsQuiz?.analytics?.question_analysis && insightsQuiz.analytics.question_analysis.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">❓ Question-Level Analysis</h3>
                <ul className="list-disc ml-6 space-y-4">
                  {insightsQuiz.analytics.question_analysis.map((q, idx) => (
                    <li key={idx} className="mb-4">
                      <strong>Q{idx + 1}:</strong> {q.q} <br />
                      <span className="flex items-center">✅ Correct Rate: {q.correct_rate.toFixed(1)}%</span>
                      <span className="flex items-center">❌ Common Wrong: {q.most_common_wrong || "None"}</span>
                      <span className="flex items-center">🎯 Correct Answer: {q.answer}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Student Feedback */} 
            {/*
            {insightsQuiz?.analytics?.student_feedback && insightsQuiz.analytics.student_feedback.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">🧑‍🎓 Student-Level Feedback</h3>
                <ul className="list-disc ml-6 space-y-4">
                  {insightsQuiz.analytics.student_feedback.map((s, idx) => (
                    <li key={idx}>
                      <strong>{s.student_id}</strong>: {s.score}/{s.total} ({s.accuracy_rate}%)<br />
                      Wrong Answers: {s.wrong_answers.length > 0 ? s.wrong_answers.join(", ") : "None"}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            */}

            {/* AI-Generated Recommendations */}
            {insights && (
              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2">🤖 AI Recommendations</h3>
                <p className="whitespace-pre-wrap text-gray-800 bg-gray-100 p-3 rounded leading-relaxed">
                  {insights}
                </p>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setInsights(null);
                  setInsightsQuiz(null);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}