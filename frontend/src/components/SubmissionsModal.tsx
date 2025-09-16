import { useEffect, useState } from "react";

interface Submission {
  student_id: string;
  attempt: number;
  score: number;
  total: number;
  answers: string[];
}

export default function SubmissionsModal({
  quizId,
  quizTitle,
  onClose,
}: {
  quizId: number;
  quizTitle: string;
  onClose: () => void;
}) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/teacher/quiz/${quizId}/${quizTitle}/submissions`)
      .then((res) => res.json())
      .then((data) => {
        if (data.submissions) {
          setSubmissions(data.submissions);
        }
      })
      .catch((err) => console.error("Error fetching submissions:", err))
      .finally(() => setLoading(false));
  }, [quizId, quizTitle]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4">
      <div className="bg-white text-gray-900 rounded-lg w-full max-w-3xl shadow-lg">
        <div className="p-6 overflow-y-auto max-h-[85vh]">
          <h2 className="text-2xl font-bold mb-4">
            📑 Submissions for "{quizTitle}"
          </h2>

          {loading ? (
            <p>Loading...</p>
          ) : submissions.length === 0 ? (
            <p>No submissions yet.</p>
          ) : (
            <table className="w-full border border-gray-300 rounded-lg">
              <thead className="bg-indigo-600 text-white">
                <tr>
                  <th className="p-2 text-left">Student</th>
                  <th className="p-2 text-left">Attempt</th>
                  <th className="p-2 text-left">Score</th>
                  <th className="p-2 text-left">Total</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s, idx) => (
                  <tr
                    key={idx}
                    className="border-b hover:bg-gray-100 transition"
                  >
                    <td className="p-2">{s.student_id}</td>
                    <td className="p-2">{s.attempt}</td>
                    <td className="p-2">{s.score}</td>
                    <td className="p-2">{s.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}