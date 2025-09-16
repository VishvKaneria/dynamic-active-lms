import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("role");
    const name = localStorage.getItem("name");

    if (role && name) {
      if (role === "teacher") {
        navigate("/teacher/dashboard");
      } else if (role === "student") {
        navigate("/student/dashboard");
      }
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white relative">
      {/* Content */}
      <div className="text-center max-w-2xl px-6">
        <h1 className="text-5xl font-extrabold mb-6 drop-shadow-lg">
          Welcome to <span className="text-yellow-300">BrightLearn</span>
        </h1>
        <p className="text-lg mb-10 opacity-90 leading-relaxed">
          An AI-powered Learning Management System for K–12 Education.  
          Personalized learning for students, powerful insights for teachers.
        </p>

        {/* Role Selection */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <button
            onClick={() => navigate("/login/teacher")}
            className="px-8 py-4 rounded-xl bg-white text-indigo-700 font-bold shadow-lg hover:bg-indigo-100 hover:scale-105 transform transition text-lg"
          >
            👩‍🏫 Continue as Teacher
          </button>
          <button
            onClick={() => navigate("/login/student")}
            className="px-8 py-4 rounded-xl bg-white text-pink-700 font-bold shadow-lg hover:bg-pink-100 hover:scale-105 transform transition text-lg"
          >
            🧑‍🎓 Continue as Student
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 text-sm opacity-80">
        Prototype LMS • Powered by AI 🚀
      </footer>
    </div>
  );
}
