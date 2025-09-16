import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Question {
  q: string;
  options: string[];
}

interface Quiz {
  id: number;
  title: string;
  subject: string;
  questions: Question[];
}

interface SubmissionResponse {
  score: number;
  total: number;
  feedback: { question: string; student_answer: string; is_correct: boolean }[];
  error?: string;
}

export default function QuizModal({
  quizId,
  quizTitle,
  studentId,
  onClose,
  onSubmitted,
}: {
  quizId: number;
  quizTitle: string;
  studentId: string;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<SubmissionResponse | null>(null);

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/student/quiz/${quizId}/${quizTitle}`)
      .then((res) => res.json())
      .then((data) => {
        setQuiz(data);
        setAnswers(new Array(data.questions.length).fill(""));
      })
      .catch((err) => console.error("Error loading quiz:", err));
  }, [quizId, quizTitle]);

  const handleSubmit = async () => {
    const payload = { student_id: studentId, answers };

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/student/quiz/${quizId}/${quizTitle}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success("Quiz submitted successfully 🎉");
        setResult(data);
        onSubmitted();
      }
    } catch (err) {
      console.error("Error submitting quiz:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4">
      <div className="bg-white text-gray-900 rounded-lg w-full max-w-2xl shadow-lg">
        <div className="p-6 overflow-y-auto max-h-[85vh]">
          {!quiz ? (
            <p>Loading quiz...</p>
          ) : result ? (
            <>
              {result.error ? (
                <p className="text-red-600 font-semibold">{result.error}</p>
              ) : (
                <>
                  <h2 className="text-2xl font-bold mb-4">
                    Results: {result.score}/{result.total}
                  </h2>
                  {result.feedback.map((f, idx) => (
                    <div
                      key={idx}
                      className={`mb-3 p-3 rounded ${
                        f.is_correct ? "bg-green-100" : "bg-red-100"
                      }`}
                    >
                      <p className="font-medium">{f.question}</p>
                      <p>
                        Your answer:{" "}
                        <span
                          className={
                            f.is_correct ? "text-green-700" : "text-red-700"
                          }
                        >
                          {f.student_answer || "No Answer"}
                        </span>
                      </p>
                    </div>
                  ))}
                </>
              )}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={onClose}
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                >
                  Close
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-4">{quiz.title}</h2>
              {quiz.questions.map((q, idx) => (
                <div key={idx} className="mb-6 border p-4 rounded-lg">
                  <p className="font-medium mb-3">
                    Q{idx + 1}: {q.q}
                  </p>
                  {q.options.map((opt, oIdx) => (
                    <label key={oIdx} className="block mb-2">
                      <input
                        type="radio"
                        name={`q-${idx}`}
                        value={opt}
                        checked={answers[idx] === opt}
                        onChange={(e) => {
                          const updated = [...answers];
                          updated[idx] = e.target.value;
                          setAnswers(updated);
                        }}
                        className="mr-2"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              ))}
              <div className="flex justify-between">
                <button
                  onClick={onClose}
                  className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Submit Quiz
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
