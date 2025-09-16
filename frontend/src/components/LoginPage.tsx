import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function LoginPage() {
  const { role } = useParams(); // "teacher" or "student"
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    if (!name.trim()) {
      alert("Please enter your name");
      return;
    }

    // Save login info
    localStorage.setItem("role", role || "");
    localStorage.setItem("name", name);

    // Redirect based on role
    if (role === "teacher") {
      navigate("/teacher/dashboard");
    } else {
      navigate("/student/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white p-8">
      <div className="bg-white text-gray-900 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {role === "teacher" ? "👩‍🏫 Teacher Login" : "🧑‍🎓 Student Login"}
        </h1>
        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full mb-4 p-2 border rounded"
        />
        <button
          onClick={handleLogin}
          className="w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          Login
        </button>
      </div>
    </div>
  );
}
