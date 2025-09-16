import { useState } from "react";
import toast from "react-hot-toast";

interface Question {
  q: string;
  options: string[];
  answer: string;
}

export default function QuizForm({
  onClose,
  onQuizCreated,
}: {
  onClose: () => void;
  onQuizCreated: () => void;
}) {
  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([
    { q: "", options: ["", "", "", ""], answer: "" },
  ]);
  const [error, setError] = useState("");

  // Add new question block
  const addQuestion = () => {
    setQuestions([
      ...questions,
      { q: "", options: ["", "", "", ""], answer: "" },
    ]);
  };

  // Remove question block
  const removeQuestion = (index: number) => {
    if (questions.length === 1) {
      setError("At least one question is required.");
      return;
    }
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);
  };

  // Validate + submit
  const handleSubmit = async () => {
    // 🔹 Validation
    if (!subject.trim() || !title.trim()) {
      setError("Subject is required.");
      return;
    }

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    if (questions.length === 0) {
      setError("At least one question is required.");
      return;
    }

    for (const q of questions) {
      if (!q.q.trim()) {
        setError("Each question must have text.");
        return;
      }
      if (q.options.some((opt) => !opt.trim())) {
        setError("All options must be filled in.");
        return;
      }
      if (!q.answer.trim()) {
        setError("Each question must have a correct answer.");
        return;
      }
    }

    setError("");

    const payload = { subject, title, questions };

    try {
      const res = await fetch("http://127.0.0.1:8000/teacher/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Quiz created successfully 🎉");
        onQuizCreated();
        onClose();
      } else {
        toast.error("Failed to create quiz ❌");
      }
    } catch (err) {
      console.error("Error:", err);
      setError("An error occurred while creating the quiz.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4">
      <div className="bg-white text-gray-900 rounded-lg w-full max-w-2xl shadow-lg">
        <div className="p-6 overflow-y-auto max-h-[85vh]">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="text-purple-600 text-3xl">➕</span> Create New Quiz
          </h2>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          <input
            type="text"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full mb-3 p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Quiz Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full mb-6 p-2 border rounded"
          />

          {/* Questions */}
          {questions.map((q, idx) => (
            <div key={idx} className="mb-6 border p-4 rounded-lg relative">
              <input
                type="text"
                placeholder={`Question ${idx + 1}`}
                value={q.q}
                onChange={(e) => {
                  const updated = [...questions];
                  updated[idx].q = e.target.value;
                  setQuestions(updated);
                }}
                className="w-full mb-3 p-2 border rounded"
              />
              {q.options.map((opt, oIdx) => (
                <input
                  key={oIdx}
                  type="text"
                  placeholder={`Option ${oIdx + 1}`}
                  value={opt}
                  onChange={(e) => {
                    const updated = [...questions];
                    updated[idx].options[oIdx] = e.target.value;
                    setQuestions(updated);
                  }}
                  className="w-full mb-2 p-2 border rounded"
                />
              ))}
              <input
                type="text"
                placeholder="Correct Answer"
                value={q.answer}
                onChange={(e) => {
                  const updated = [...questions];
                  updated[idx].answer = e.target.value;
                  setQuestions(updated);
                }}
                className="w-full p-2 border rounded"
              />

              {/* Remove Button */}
              {questions.length > 1 && (
                <button
                  onClick={() => removeQuestion(idx)}
                  className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-sm"
                  >
                  Remove
                </button>
              )}
            </div>
          ))}

          <button
            onClick={addQuestion}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            ➕ Add Question
          </button>

          <div className="mt-6 flex justify-between">
            <button
              onClick={onClose}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Save Quiz
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
