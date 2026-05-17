import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { AppContext } from "../context/AppContext";
import axios from "../api/axios";
import { toast } from "react-toastify";

const Navbar = () => {
  const navigate = useNavigate();

  const {
    userData,
    setUserData,
    setIsLoggedin,
  } = useContext(AppContext);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const sendVerificationOtp = async () => {
    try {
      const { data } = await axios.post("/api/auth/send-verify-otp");
      
      if (data.success) {
        toast.success(data.message);
        navigate("/email-verify");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const logout = async () => {
    try {
      const { data } = await axios.post("/api/auth/logout");
      
      if (data.success) {
        setIsLoggedin(false);
        setUserData(false);
        navigate('/');
        toast.success(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } 
  }

  // Handle clicking outside to close dropdown (optional but good practice)
  const closeDropdown = () => setIsDropdownOpen(false);

  return (
    <div className="w-full flex items-center justify-between px-6 sm:px-24 py-5 absolute top-0 bg-transparent z-50">
      
      {/* Logo */}
      <img
        src={assets.logo}
        alt="MERN Auth"
        className="w-28 sm:w-32 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => navigate("/")}
      />

      {/* User Section */}
      {userData ? (
        <div className="relative">
          <div 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 bg-slate-900/50 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full hover:border-white/20 transition-all cursor-pointer shadow-lg active:scale-95"
          >
            <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full text-white font-bold text-sm shadow-inner ring-2 ring-white/10 transition-all">
              {userData.username?.[0]?.toUpperCase()}
            </div>
            <span className="text-white text-sm font-medium hidden sm:block">
              {userData.username}
            </span>
            <img 
              src={assets.arrow_icon} 
              alt="" 
              className={`w-2.5 opacity-50 transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`} 
            />
          </div>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 z-10 w-48">
              <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-1">
                <ul className="list-none m-0 p-0 text-sm">
                  {!userData.isVerified && (
                    <li 
                      className="py-3 px-4 text-indigo-100 hover:bg-slate-800 cursor-pointer flex items-center gap-2 transition-colors border-b border-white/5" 
                      onClick={() => {
                        closeDropdown();
                        sendVerificationOtp();
                      }}
                    >
                      <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
                      Verify Email
                    </li>
                  )}

                  <li 
                    className="py-3 px-4 text-rose-400 hover:bg-rose-500/10 cursor-pointer flex items-center gap-2 transition-colors font-medium" 
                    onClick={() => {
                      closeDropdown();
                      logout();
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => navigate("/login")}
          className="bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center gap-2 px-6 sm:px-8 py-2.5 rounded-full hover:bg-white hover:text-black transition-all duration-300 font-semibold shadow-lg active:scale-95 group text-sm sm:text-base"
        >
          Login
          <img
            src={assets.arrow_icon}
            alt="Arrow"
            className="w-3 brightness-0 invert group-hover:brightness-100 group-hover:invert-0"
          />
        </button>
      )}
    </div>
  );
};

export default Navbar;