import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Header from "../components/Header";
import { assets } from "../assets/assets";
import { AppContext } from "../context/AppContext";

const Home = () => {
  const navigate = useNavigate();
  const { isLoggedin } = useContext(AppContext);

  // Removed auto-redirect to allow landing page to show first
  /*
  useEffect(() => {
    if (isLoggedin) {
      navigate("/legal-tech");
    }
  }, [isLoggedin, navigate]);
  */

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen px-6 sm:px-24 bg-[#1C1615] relative overflow-hidden"
    >
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#801C2B]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#C49A45]/5 blur-[100px] pointer-events-none" />
      <Navbar />
      <Header />
    </div>
  );
};

export default Home;
