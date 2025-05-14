import React, { useState, useRef, useEffect } from "react";
import { FiX, FiMail, FiUser, FiCheckCircle } from "react-icons/fi";
import api from "../api";

// === Color palette (edit these hex codes as you wish) ===
const modalBg = "#f8fafc";
const modalShadow = "#bdbdbd";
const progressBg = "#e0e0e0";
const progressBar = "linear-gradient(90deg, #2196f3, #3f51b5, #7c4dff)";
const iconBg = "linear-gradient(135deg, #2196f3, #7c4dff)";
const buttonBg = "linear-gradient(90deg, #2196f3, #3f51b5, #7c4dff)";
const buttonHover = "linear-gradient(90deg, #64b5f6, #7986cb, #b388ff)";
const textColor = "#1a237e";
const subTextColor = "#374151";
const inputBorder = "#bdbdbd";
const inputFocus = "#2196f3";
const errorColor = "#d32f2f";
const successColor = "#388e3c";
const otpBorder = "#bdbdbd";
const otpFocus = "#2196f3";
const resendActive = "#2196f3";
const resendInactive = "#bdbdbd";
const closeColor = "#374151";
const closeHover = "#d32f2f";
const overlayBg = "linear-gradient(135deg, #F6F0F040 0%, #C6E7FF40   100%)"; // 99 = ~60% opacity

const MAX_OTP_ATTEMPTS = 3;
const MAX_RESENDS = 3;
const LOCKOUT_SECONDS = 10;

function SignupModal({ show, onClose }) {
  // State
  const [step, setStep] = useState(1);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(300);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [resendCount, setResendCount] = useState(0);
  const [lockout, setLockout] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(LOCKOUT_SECONDS);
  const [lockoutReason, setLockoutReason] = useState("");
  const otpRefs = useRef([...Array(6)].map(() => React.createRef()));

  // Timer logic
  useEffect(() => {
    if (step === 2 && timer > 0 && !lockout) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
    if (timer === 0) setCanResend(true);
  }, [step, timer, lockout]);

  // Reset on close
  useEffect(() => {
    if (!show) {
      setStep(1);
      setUserName("");
      setUserEmail("");
      setErrorMessage("");
      setOtpDigits(["", "", "", "", "", ""]);
      setTimer(300);
      setCanResend(false);
      setLoading(false);
      setOtpAttempts(0);
      setResendCount(0);
      setLockout(false);
      setLockoutTimer(LOCKOUT_SECONDS);
      setLockoutReason("");
    }
  }, [show]);

  // Lockout timer effect
  useEffect(() => {
    if (lockout) {
      if (lockoutTimer > 0) {
        const interval = setInterval(() => setLockoutTimer(t => t - 1), 1000);
        return () => clearInterval(interval);
      } else {
        setLockout(false);
        setLockoutTimer(LOCKOUT_SECONDS);
        setLockoutReason("");
        onClose();
      }
    }
  }, [lockout, lockoutTimer, onClose]);

  // Send OTP
  const sendOtp = async () => {
    setErrorMessage("");
    setLoading(true);
    try {
      await api.post("/account/signup/", { name: userName, email: userEmail });
      setStep(2);
      setTimer(300);
      setCanResend(false);
      setOtpDigits(["", "", "", "", "", ""]);
      setOtpAttempts(0);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.error ||
          err.response?.data?.email?.[0] ||
          "Failed to send OTP."
      );
    }
    setLoading(false);
  };

  // Resend OTP
  const resendOtp = () => {
    if (!canResend || resendCount >= MAX_RESENDS || lockout) return;
    if (resendCount + 1 >= MAX_RESENDS) {
      setLockout(true);
      setLockoutReason("resend");
      setErrorMessage(
        `Maximum OTP resends exceeded. Retry signup in ${LOCKOUT_SECONDS} seconds...`
      );
      return;
    }
    setResendCount(count => count + 1);
    sendOtp();
  };

  // OTP input logic
  const handleOtpChange = (idx, value) => {
    if (!/^\d?$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[idx] = value;
    setOtpDigits(newDigits);
    if (value && idx < 5) otpRefs.current[idx + 1].current.focus();
  };

  // Backspace logic
  const handleOtpKeyDown = (idx, e) => {
    if (e.key === "Backspace") {
      if (otpDigits[idx] === "" && idx > 0) {
        otpRefs.current[idx - 1].current.focus();
      }
    }
  };

  // Improved paste handler: works on any input, fills all boxes
  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (pasted.length) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || "";
      }
      setOtpDigits(newDigits);
      // Focus the last filled box
      const lastIdx = Math.min(pasted.length, 6) - 1;
      if (lastIdx >= 0) otpRefs.current[lastIdx].current.focus();
      e.preventDefault();
    }
  };

  // Verify OTP
  const verifyOtp = async () => {
    setErrorMessage("");
    const otp = otpDigits.join("");
    if (otp.length < 6) {
      setErrorMessage("Please enter the complete 6-digit OTP.");
      return;
    }
    if (otpAttempts + 1 >= MAX_OTP_ATTEMPTS) {
      setLockout(true);
      setLockoutReason("otp");
      setErrorMessage(
        `Maximum OTP attempts exceeded. Retry signup in ${LOCKOUT_SECONDS} seconds...`
      );
      return;
    }
    setLoading(true);
    try {
      await api.post("/account/otp-verify/", { email: userEmail, otp });
      setStep(3);
    } catch (err) {
      setOtpAttempts(attempts => attempts + 1);
      setErrorMessage(
        err.response?.data?.error ||
          err.response?.data?.otp?.[0] ||
          "Invalid OTP."
      );
    }
    setLoading(false);
  };

  // Progress bar
  const progress = step === 1 ? "w-1/3" : step === 2 ? "w-2/3" : "w-full";

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
      style={{
        background: overlayBg,
      }}
    >
      <div
        className="relative w-full max-w-md mx-auto rounded-3xl shadow-2xl backdrop-blur-lg p-8"
        style={{
          background: modalBg,
          boxShadow: `0 8px 32px 0 ${modalShadow}`,
          border: "1px solid rgba(255,255,255,0.3)",
        }}
      >
        {/* Close button */}
        <button
          className="absolute top-4 right-4 text-2xl"
          style={{ color: closeColor }}
          onMouseOver={e => (e.currentTarget.style.color = closeHover)}
          onMouseOut={e => (e.currentTarget.style.color = closeColor)}
          onClick={onClose}
          aria-label="Close"
        >
          <FiX />
        </button>

        {/* Progress bar */}
        <div
          className="w-full h-2 rounded-full mt-3 mb-6 overflow-hidden"
          style={{ background: progressBg }}
        >
          <div
            className={`h-full transition-all duration-500 ${progress}`}
            style={{ background: progressBar }}
          ></div>
        </div>

        {/* Step 1: User Info */}
        {step === 1 && (
          <>
            <div className="flex flex-col items-center mb-6">
              <div
                className="p-3 rounded-full mb-2"
                style={{ background: iconBg }}
              >
                <FiUser className="text-white text-3xl" />
              </div>
              <h2
                className="text-2xl font-bold mb-2"
                style={{ color: textColor }}
              >
                Create your account
              </h2>
              <p
                className="text-center"
                style={{ color: subTextColor }}
              >
                Enter your name and email to get started.
              </p>
            </div>
            <form
              onSubmit={e => {
                e.preventDefault();
                sendOtp();
              }}
              className="space-y-4"
            >
              <div className="relative">
                <FiUser
                  className="absolute left-3 top-3"
                  style={{ color: inputBorder }}
                />
                <input
                  className="w-full pl-10 pr-4 py-3 rounded-xl border outline-none text-lg"
                  style={{
                    border: `1px solid ${inputBorder}`,
                    background: "#fff",
                  }}
                  placeholder="Full Name"
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  required
                  autoFocus
                  onFocus={e =>
                    (e.target.style.boxShadow = `0 0 0 2px ${inputFocus}33`)
                  }
                  onBlur={e => (e.target.style.boxShadow = "none")}
                />
              </div>
              <div className="relative">
                <FiMail
                  className="absolute left-3 top-3"
                  style={{ color: inputBorder }}
                />
                <input
                  className="w-full pl-10 pr-4 py-3 rounded-xl border outline-none text-lg"
                  style={{
                    border: `1px solid ${inputBorder}`,
                    background: "#fff",
                  }}
                  placeholder="Email"
                  type="email"
                  value={userEmail}
                  onChange={e => setUserEmail(e.target.value)}
                  required
                  onFocus={e =>
                    (e.target.style.boxShadow = `0 0 0 2px ${inputFocus}33`)
                  }
                  onBlur={e => (e.target.style.boxShadow = "none")}
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl text-white font-bold text-lg shadow-lg hover:scale-105 transition"
                style={{ background: buttonBg }}
                onMouseOver={e =>
                  (e.currentTarget.style.background = buttonHover)
                }
                onMouseOut={e =>
                  (e.currentTarget.style.background = buttonBg)
                }
                disabled={loading}
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
              {errorMessage && (
                <div
                  style={{ color: errorColor }}
                  className="text-center mt-2"
                >
                  {errorMessage}
                </div>
              )}
            </form>
          </>
        )}

        {/* Step 2: OTP */}
        {step === 2 && (
          <>
            <div className="flex flex-col items-center mb-6">
              <div
                className="p-3 rounded-full mb-2"
                style={{ background: iconBg }}
              >
                <FiMail className="text-white text-3xl" />
              </div>
              <h2
                className="text-2xl font-bold mb-2"
                style={{ color: textColor }}
              >
                Enter OTP
              </h2>
              <p
                className="text-center"
                style={{ color: subTextColor }}
              >
                We’ve sent a 6-digit code to{" "}
                <span style={{ fontWeight: 600 }}>{userEmail}</span>
              </p>
            </div>
            <form
              onSubmit={e => {
                e.preventDefault();
                verifyOtp();
              }}
              className="space-y-4"
            >
              <div className="flex justify-center gap-2 mb-2">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={otpRefs.current[idx]}
                    className="w-12 h-12 text-center rounded-xl border text-2xl outline-none"
                    style={{
                      border: `1px solid ${otpBorder}`,
                      background: "#fff",
                    }}
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(idx, e.target.value)}
                    onPaste={handleOtpPaste}
                    onKeyDown={e => handleOtpKeyDown(idx, e)}
                    required
                    disabled={lockout}
                    onFocus={e =>
                      (e.target.style.boxShadow = `0 0 0 2px ${otpFocus}33`)
                    }
                    onBlur={e => (e.target.style.boxShadow = "none")}
                  />
                ))}
              </div>
              <div
                className="flex justify-between items-center text-sm"
                style={{ color: subTextColor }}
              >
                <span>
                  {`Time left: ${String(Math.floor(timer / 60)).padStart(
                    2,
                    "0"
                  )}:${String(timer % 60).padStart(2, "0")}`}
                </span>
                <button
                  type="button"
                  className="font-semibold"
                  style={{
                    color:
                      canResend && resendCount < MAX_RESENDS && !lockout
                        ? resendActive
                        : resendInactive,
                    cursor:
                      canResend && resendCount < MAX_RESENDS && !lockout
                        ? "pointer"
                        : "not-allowed",
                    textDecoration:
                      canResend && resendCount < MAX_RESENDS && !lockout
                        ? "underline"
                        : "none",
                  }}
                  onClick={resendOtp}
                  disabled={
                    !canResend ||
                    resendCount >= MAX_RESENDS ||
                    lockout
                  }
                >
                  Resend OTP
                  {resendCount > 0
                    ? ` (${MAX_RESENDS - resendCount} left)`
                    : ""}
                </button>
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl text-white font-bold text-lg shadow-lg hover:scale-105 transition"
                style={{ background: buttonBg }}
                onMouseOver={e =>
                  (e.currentTarget.style.background = buttonHover)
                }
                onMouseOut={e =>
                  (e.currentTarget.style.background = buttonBg)
                }
                disabled={loading || lockout}
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
              {errorMessage && (
                <div
                  style={{ color: errorColor }}
                  className="text-center mt-2"
                >
                  {errorMessage}
                  {lockout && (
                    <div style={{ fontWeight: "bold" }}>
                      Closing in {lockoutTimer} seconds...
                    </div>
                  )}
                </div>
              )}
            </form>
          </>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="flex flex-col items-center justify-center py-12">
            <FiCheckCircle
              className="mb-4"
              style={{ color: successColor, fontSize: "3rem" }}
            />
            <h2
              className="text-2xl font-bold mb-2"
              style={{ color: successColor }}
            >
              Signup Successful!
            </h2>
            <p
              className="mb-6 text-center"
              style={{ color: textColor }}
            >
              Your account has been created. You can now log in.
            </p>
            <button
              className="w-full py-3 rounded-xl text-white font-bold text-lg shadow-lg hover:scale-105 transition"
              style={{ background: buttonBg }}
              onMouseOver={e =>
                (e.currentTarget.style.background = buttonHover)
              }
              onMouseOut={e =>
                (e.currentTarget.style.background = buttonBg)
              }
              onClick={onClose}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SignupModal;