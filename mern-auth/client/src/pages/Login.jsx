import { useState, useContext } from "react";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import axios from "../api/axios";
import { toast } from "react-toastify";

const Login = () => {
  const navigate = useNavigate();
  const { setIsLoggedin, getUserData } = useContext(AppContext);

  const [state, setState] = useState("Sign Up");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const onSubmitHandler = async (e) => {
    try {
      e.preventDefault();
      setIsLoading(true);

      if (state === "Sign Up") {
        const { data } = await axios.post(`/api/auth/register`, {
          name,
          email,
          password,
        });
        if (data.success) {
          setIsLoggedin(true);
          getUserData();
          toast.success("Account created successfully!");
          navigate("/legal-tech");
        } else {
          toast.error(data.message);
        }
      } else {
        const { data } = await axios.post(`/api/auth/login`, {
          email,
          password,
        });
        if (data.success) {
          setIsLoggedin(true);
          getUserData();
          toast.success("Welcome back!");
          navigate("/legal-tech");
        } else {
          toast.error(data.message);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStateChange = (newState) => {
    setState(newState);
    setName("");
    setEmail("");
    setPassword("");
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-6 sm:px-0 bg-gradient-to-br from-blue-200 to-purple-400">
      <button
        onClick={() => navigate("/")}
        className="absolute left-4 sm:left-20 top-4 sm:top-5 flex items-center gap-2 text-slate-800 font-semibold hover:text-slate-600 transition-all bg-white/40 backdrop-blur-lg px-4 sm:px-6 py-2 sm:py-2.5 rounded-full border border-white/50 shadow-lg active:scale-95 text-sm sm:text-base"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back
      </button>

      <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-10 w-full max-w-md sm:w-[28rem] text-indigo-100 border border-slate-700/50 mt-16 sm:mt-0">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-white tracking-tight">
            {state === "Sign Up" ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="text-indigo-200/70 text-sm">
            {state === "Sign Up"
              ? "Start analyzing contracts with LegalAssist-AI"
              : "Login to access LegalAssist-AI dashboard"}
          </p>
        </div>

        <form onSubmit={onSubmitHandler} className="space-y-5">
          {state === "Sign Up" && (
            <div className="group">
              <label className="block text-xs font-medium text-indigo-300 mb-1.5 ml-1 uppercase tracking-wider">
                Full Name
              </label>
              <div className="flex items-center gap-3 w-full bg-[#1e293b]/50 border border-slate-700 rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 focus-within:border-blue-500/50 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all duration-300 hover:border-slate-600">
                <img
                  src={assets.person_icon}
                  alt=""
                  className="w-5 opacity-50 group-focus-within:opacity-100 transition-opacity"
                />
                <input
                  onChange={(e) => setName(e.target.value)}
                  value={name}
                  type="text"
                  placeholder="Enter your name"
                  required
                  className="bg-transparent outline-none w-full text-white placeholder:text-slate-500"
                />
              </div>
            </div>
          )}

          <div className="group">
            <label className="block text-xs font-medium text-indigo-300 mb-1.5 ml-1 uppercase tracking-wider">
              Email Address
            </label>
            <div className="flex items-center gap-3 w-full bg-[#1e293b]/50 border border-slate-700 rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 focus-within:border-blue-500/50 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all duration-300">
              <img
                src={assets.mail_icon}
                alt=""
                className="w-5 opacity-50 group-focus-within:opacity-100 transition-opacity"
              />
              <input
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                type="email"
                placeholder="Enter your email"
                required
                className="bg-transparent outline-none w-full text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="group">
            <label className="block text-xs font-medium text-indigo-300 mb-1.5 ml-1 uppercase tracking-wider">
              Password
            </label>
            <div className="flex items-center gap-3 w-full bg-[#1e293b]/50 border border-slate-700 rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 focus-within:border-blue-500/50 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all duration-300">
              <img
                src={assets.lock_icon}
                alt=""
                className="w-5 opacity-50 group-focus-within:opacity-100 transition-opacity"
              />
              <input
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                type="password"
                placeholder="Enter your password"
                required
                className="bg-transparent outline-none w-full text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          {state !== "Sign Up" && (
            <div className="text-right">
              <span
                onClick={() => navigate("/reset-password")}
                className="text-sm text-blue-400 hover:text-blue-300 cursor-pointer transition-colors font-medium">
                Forgot password?
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold py-3 sm:py-4 rounded-2xl shadow-xl shadow-blue-500/20 transform active:scale-[0.98] transition-all duration-200 mt-2 flex items-center justify-center gap-2">
            {isLoading ? (
              <>
                <span className="inline-block animate-spin">⚙️</span>
                {state === "Sign Up" ? "Creating Account..." : "Signing In..."}
              </>
            ) : (
              <>
                {state === "Sign Up" ? "Create Account" : "Sign In"}
                <i className="fas fa-arrow-right"></i>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          {state === "Sign Up" ? (
            <p className="text-indigo-200/50 text-sm">
              Already have an account?{" "}
              <button
                className="text-white font-semibold hover:underline decoration-blue-500 decoration-2 underline-offset-4"
                onClick={() => handleStateChange("Login")}>
                Sign In
              </button>
            </p>
          ) : (
            <p className="text-indigo-200/50 text-sm">
              Don't have an account?{" "}
              <button
                className="text-white font-semibold hover:underline decoration-blue-500 decoration-2 underline-offset-4"
                onClick={() => handleStateChange("Sign Up")}>
                Create One
              </button>
            </p>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-slate-700/50">
          <div className="flex items-center justify-center text-xs text-indigo-200/50 gap-2">
            <i className="fas fa-shield text-green-400"></i>
            <span>Secured with industry-standard encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
