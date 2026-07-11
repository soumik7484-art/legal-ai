import React, { useEffect } from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { useContext } from 'react'
import { AppContext } from '../context/AppContext'
import axios from '../api/axios'
import { toast } from 'react-toastify';

const EmailVerify = () => {

  const { isLoggedin, userData, getUserData } = useContext(AppContext)
  const navigate = useNavigate();

  const inputRefs = React.useRef([]);

  const handleInput = (e, index) => {
    const value = e.target.value;
    if (value.length > 0 && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && index > 0 && !e.target.value) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData('text');
    const pasteArray = paste.split('').slice(0, 6);
    pasteArray.forEach((char, index) => {
      if (inputRefs.current[index]) {
        inputRefs.current[index].value = char;
      }
    });
  };

  const onSubmitHandler = async (e) => {
    try {
      e.preventDefault();
      const otpArray = inputRefs.current.map(e => e.value);
      const otp = otpArray.join('');
      
      const { data } = await axios.post(`/api/auth/verify-account`, { otp });

      if (data.success) {
        toast.success(data.message);
        getUserData();
        navigate('/');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  useEffect(() => {
    if (isLoggedin && userData && userData.isVerified) {
      navigate('/');
    }
  }, [isLoggedin, userData, navigate]);

  return (
    <div className='flex items-center justify-center min-h-screen px-6 sm:px-0 bg-[#1C1615] relative overflow-hidden'>
      {/* Ambient background glows */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#801C2B]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#C49A45]/5 blur-[100px] pointer-events-none" />

      <img 
        onClick={() => navigate('/')} 
        src={assets.logo} 
        alt="Logo" 
        className='absolute left-4 sm:left-20 top-4 sm:top-5 w-24 sm:w-32 cursor-pointer hover:opacity-80 transition-opacity'
      />

      <div className='bg-[#241D1C]/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-10 w-full max-w-md text-amber-50 border border-[#D4AF37]/15 mt-16 sm:mt-0'>
        <div className='text-center mb-6 sm:mb-8'>
          <h2 className='text-2xl sm:text-3xl font-bold mb-2 text-white tracking-tight'>Email Verification</h2>
          <p className='text-[#CBBFB7] text-sm'>Enter the 6-digit code sent to your email</p>
        </div>

        <form onSubmit={onSubmitHandler} className='space-y-8'>
          <div className='flex justify-between gap-2' onPaste={handlePaste}>
            {Array(6).fill(0).map((_, index) => (
              <input 
                key={index} 
                type="text" 
                maxLength="1" 
                className='w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-xl bg-[#1C1615]/50 border border-[#D4AF37]/20 text-white outline-none focus:border-[#801C2B] focus:ring-4 focus:ring-[#801C2B]/10 transition-all' 
                ref={e => inputRefs.current[index] = e} 
                onInput={(e) => handleInput(e, index)} 
                onKeyDown={(e) => handleKeyDown(e, index)} 
                required 
              />
            ))}
          </div>

          <button className='w-full bg-gradient-to-r from-[#801C2B] to-[#A62B44] hover:from-[#9E2437] hover:to-[#B53247] text-white font-bold py-3 sm:py-4 rounded-2xl shadow-xl shadow-[#801C2B]/20 transform active:scale-[0.98] transition-all duration-200'>
            Verify Email
          </button>
        </form>
      </div>
    </div>
  )
}

export default EmailVerify;