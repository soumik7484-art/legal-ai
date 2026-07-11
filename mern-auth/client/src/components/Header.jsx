import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { assets } from "../assets/assets";

const Header = () => {
  const navigate = useNavigate();
  const { userData } = useContext(AppContext);

  const handleGetStarted = () => {
    navigate("/legal-tech");
  };

  return (
    <div className="flex flex-col items-center justify-center text-center mb-20 px-4 text-gray-800">
      <div className="mb-6 transform hover:scale-105 transition-transform duration-300">
        <img
          src={assets.legal_logo}
          alt="Legal Tech Logo"
          className="w-36 h-36 rounded-full mb-6 shadow-2xl shadow-[#801C2B]/30 border-4 border-[#241D1C] object-cover"
        />
      </div>
      <h1 className="flex items-center gap-2 text-xl sm:text-3xl font-medium mb-2 text-white">
        Hello {userData?.name || userData?.username || "Guest"}!
        <img src={assets.logo_icon} className="w-8 aspect-square" alt="" />
      </h1>
      <h2 className="text-2xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-[#C49A45] via-[#E2C792] to-[#A62B44] bg-clip-text text-transparent">
        Welcome to LegalAssist
      </h2>
      <p className="mb-8 max-w-md text-gray-300 leading-relaxed">
        Your contracts are secure and private. Analyze legal agreements instantly with deep-dive structured compliance and risk intelligence.
      </p>
      <button
        onClick={handleGetStarted}
        className="bg-gradient-to-r from-[#801C2B] to-[#A62B44] hover:from-[#9E2437] hover:to-[#B53247] text-white px-10 py-4 rounded-full font-semibold transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-[#801C2B]/35 transform hover:scale-105 active:scale-95">
        <i className="fas fa-balance-scale mr-2"></i>
        Get Started with LegalAssist
      </button>
    </div>
  );
};

export default Header;
