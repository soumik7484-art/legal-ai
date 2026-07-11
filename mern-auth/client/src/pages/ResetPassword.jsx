import React, { useState } from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import axios from '../api/axios'
import { toast } from 'react-toastify';

const ResetPassword = () => {

  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [isEmailSent, setIsEmailSent] = useState(false)
  const [isOtpSubmitted, setIsOtpSubmitted] = useState(false)

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

  const onPaste = (e) => {
    const paste = e.clipboardData.getData('text');
    const pasteArray = paste.split('');
    pasteArray.forEach((char, index) => {
      if (inputRefs.current[index]) {
        inputRefs.current[index].value = char;
      }
    });
  };

  const onSubmitEmail = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`/api/auth/send-reset-password-otp`, { email });
      if (data.success) {
        toast.success(data.message);
        setIsEmailSent(true);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  }

  const onSubmitOTP = async (e) => {
    e.preventDefault();
    const otpArray = inputRefs.current.map(e => e.value);
    setOtp(otpArray.join(''));
    setIsOtpSubmitted(true);
  }

  const onSubmitNewPassword = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`/api/auth/reset-password`, { email, otp, newPassword });
      if (data.success) {
        toast.success(data.message);
        navigate('/login');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  }

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

      {/* Enter Email Form */}
      {!isEmailSent && (
        <div className='bg-[#241D1C]/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-10 w-full max-w-md sm:w-[28rem] text-amber-50 border border-[#D4AF37]/15 mt-16 sm:mt-0'>
          <div className='text-center mb-6 sm:mb-8'>
            <h2 className='text-2xl sm:text-3xl font-bold mb-2 text-white tracking-tight'>Reset Password</h2>
            <p className='text-[#CBBFB7] text-sm'>Enter your registered email address</p>
          </div>
          
          <form onSubmit={onSubmitEmail} className='space-y-6'>
            <div className='group'>
              <label className='block text-xs font-medium text-[#C49A45] mb-1.5 ml-1 uppercase tracking-wider'>Email Address</label>
              <div className='flex items-center gap-3 w-full bg-[#1C1615]/50 border border-[#D4AF37]/15 rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 focus-within:border-[#801C2B] focus-within:ring-4 focus-within:ring-[#801C2B]/10 transition-all duration-300'>
                <img src={assets.mail_icon} alt="" className='w-5 opacity-50 group-focus-within:opacity-100 transition-opacity' />
                <input 
                  type="email" 
                  placeholder='Enter your email' 
                  className='bg-transparent outline-none w-full text-white placeholder:text-stone-600' 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                />
              </div>
            </div>
            <button className='w-full bg-gradient-to-r from-[#801C2B] to-[#A62B44] hover:from-[#9E2437] hover:to-[#B53247] text-white font-bold py-3 sm:py-4 rounded-2xl shadow-xl shadow-[#801C2B]/20 transform active:scale-[0.98] transition-all duration-200'>
              Send OTP
            </button>
          </form>
        </div>
      )}

      {/* OTP Form */}
      {isEmailSent && !isOtpSubmitted && (
        <div className='bg-[#241D1C]/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-10 w-full max-w-md sm:w-[28rem] text-amber-50 border border-[#D4AF37]/15 mt-16 sm:mt-0'>
          <div className='text-center mb-6 sm:mb-8'>
            <h2 className='text-2xl sm:text-3xl font-bold mb-2 text-white tracking-tight'>Verify OTP</h2>
            <p className='text-[#CBBFB7] text-sm'>Enter the 6-digit code sent to your email</p>
          </div>

          <form onSubmit={onSubmitOTP} className='space-y-8'>
            <div className='flex justify-between gap-2' onPaste={onPaste}>
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
              Submit OTP
            </button>
          </form>
        </div>
      )}

      {/* New Password Form */}
      {isOtpSubmitted && (
        <div className='bg-[#241D1C]/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-10 w-full max-w-md sm:w-[28rem] text-amber-50 border border-[#D4AF37]/15 mt-16 sm:mt-0'>
          <div className='text-center mb-6 sm:mb-8'>
            <h2 className='text-2xl sm:text-3xl font-bold mb-2 text-white tracking-tight'>New Password</h2>
            <p className='text-[#CBBFB7] text-sm'>Set your new account password</p>
          </div>

          <form onSubmit={onSubmitNewPassword} className='space-y-6'>
            <div className='group'>
              <label className='block text-xs font-medium text-[#C49A45] mb-1.5 ml-1 uppercase tracking-wider'>New Password</label>
              <div className='flex items-center gap-3 w-full bg-[#1C1615]/50 border border-[#D4AF37]/15 rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 focus-within:border-[#801C2B] focus-within:ring-4 focus-within:ring-[#801C2B]/10 transition-all duration-300'>
                <img src={assets.lock_icon} alt="" className='w-5 opacity-50 group-focus-within:opacity-100 transition-opacity' />
                <input 
                  type="password" 
                  placeholder='Enter new password' 
                  className='bg-transparent outline-none w-full text-white placeholder:text-stone-600' 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  required 
                />
              </div>
            </div>
            <button className='w-full bg-gradient-to-r from-[#801C2B] to-[#A62B44] hover:from-[#9E2437] hover:to-[#B53247] text-white font-bold py-3 sm:py-4 rounded-2xl shadow-xl shadow-[#801C2B]/20 transform active:scale-[0.98] transition-all duration-200'>
              Reset Password
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

export default ResetPassword