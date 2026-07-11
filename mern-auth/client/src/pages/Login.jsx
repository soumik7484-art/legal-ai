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
    <div className="flex items-center justify-center min-h-screen px-6 sm:px-0 bg-[#1C1615] relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#801C2B]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#C49A45]/5 blur-[100px] pointer-events-none" />

      <button
        onClick={() => navigate("/")}
        className="absolute left-4 sm:left-20 top-4 sm:top-5 flex items-center gap-2 text-[#FAF8F5] font-semibold hover:text-[#CBBFB7] transition-all bg-[#241D1C]/65 backdrop-blur-lg px-4 sm:px-6 py-2 sm:py-2.5 rounded-full border border-[#FAF8F5]/10 shadow-lg active:scale-95 text-sm sm:text-base"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back
      </button>

      <div className="bg-[#241D1C]/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-10 w-full max-w-md sm:w-[28rem] text-amber-50 border border-[#D4AF37]/15 mt-16 sm:mt-0">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-white tracking-tight">
            {state === "Sign Up" ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="text-[#CBBFB7] text-sm">
            {state === "Sign Up"
              ? "Start auditing contracts with LegalAssist"
              : "Login to access LegalAssist dashboard"}
          </p>
        </div>

        <form onSubmit={onSubmitHandler} className="space-y-5">
          {state === "Sign Up" && (
            <div className="group">
              <label className="block text-xs font-medium text-[#C49A45] mb-1.5 ml-1 uppercase tracking-wider">
                Full Name
              </label>
              <div className="flex items-center gap-3 w-full bg-[#1C1615]/50 border border-[#D4AF37]/15 rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 focus-within:border-[#801C2B] focus-within:ring-4 focus-within:ring-[#801C2B]/10 transition-all duration-300">
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
                  className="bg-transparent outline-none w-full text-white placeholder:text-stone-600"
                />
              </div>
            </div>
          )}

          <div className="group">
            <label className="block text-xs font-medium text-[#C49A45] mb-1.5 ml-1 uppercase tracking-wider">
              Email Address
            </label>
            <div className="flex items-center gap-3 w-full bg-[#1C1615]/50 border border-[#D4AF37]/15 rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 focus-within:border-[#801C2B] focus-within:ring-4 focus-within:ring-[#801C2B]/10 transition-all duration-300">
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
                className="bg-transparent outline-none w-full text-white placeholder:text-stone-600"
              />
            </div>
          </div>

          <div className="group">
            <label className="block text-xs font-medium text-[#C49A45] mb-1.5 ml-1 uppercase tracking-wider">
              Password
            </label>
            <div className="flex items-center gap-3 w-full bg-[#1C1615]/50 border border-[#D4AF37]/15 rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 focus-within:border-[#801C2B] focus-within:ring-4 focus-within:ring-[#801C2B]/10 transition-all duration-300">
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
                className="bg-transparent outline-none w-full text-white placeholder:text-stone-600"
              />
            </div>
          </div>

          {state !== "Sign Up" && (
            <div className="text-right">
              <span
                onClick={() => navigate("/reset-password")}
                className="text-sm text-[#C49A45] hover:text-[#d4af37] cursor-pointer transition-colors font-medium">
                Forgot password?
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#801C2B] to-[#A62B44] hover:from-[#9E2437] hover:to-[#B53247] disabled:from-stone-700 disabled:to-stone-700 text-white font-bold py-3 sm:py-4 rounded-2xl shadow-xl shadow-[#801C2B]/15 transform active:scale-[0.98] transition-all duration-200 mt-2 flex items-center justify-center gap-2">
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
            <p className="text-[#CBBFB7]/70 text-sm">
              Already have an account?{" "}
              <button
                className="text-white font-semibold hover:underline decoration-[#801C2B] decoration-2 underline-offset-4"
                onClick={() => handleStateChange("Login")}>
                Sign In
              </button>
            </p>
          ) : (
            <p className="text-[#CBBFB7]/70 text-sm">
              Don't have an account?{" "}
              <button
                className="text-white font-semibold hover:underline decoration-[#801C2B] decoration-2 underline-offset-4"
                onClick={() => handleStateChange("Sign Up")}>
                Create One
              </button>
            </p>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-[#D4AF37]/15">
          <div className="flex items-center justify-center text-xs text-[#CBBFB7]/65 gap-2">
            <i className="fas fa-shield text-[#C49A45]"></i>
            <span>Secured with industry-standard encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
