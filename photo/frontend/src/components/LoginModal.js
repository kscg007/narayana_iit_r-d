import React, { useState, useEffect } from "react";
import { FiX, FiMail, FiLock, FiKey, FiShield, FiEye, FiEyeOff, FiCheckCircle } from "react-icons/fi";
import api from "../api";

// === Color palette (reuse from SignupModal) ===
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
const closeColor = "#374151";
const closeHover = "#d32f2f";
const overlayBg = "linear-gradient(135deg, #F6F0F040 0%, #C6E7FF40   100%)";

const PASSWORD_VALIDATORS = [
  { key: "minLength", label: "At least 12 characters", test: p => p.length >= 12 },
  { key: "uppercase", label: "One uppercase letter", test: p => /[A-Z]/.test(p) },
  { key: "lowercase", label: "One lowercase letter", test: p => /[a-z]/.test(p) },
  { key: "number", label: "One number", test: p => /\d/.test(p) },
  { key: "symbol", label: "One symbol (!@#$%^&*()_+)", test: p => /[!@#$%^&*()_+]/.test(p) },
];

// Helper to extract all backend errors
function extractBackendError(err) {
  const data = err.response?.data;
  if (!data) return "An unexpected error occurred.";
  if (typeof data === "string") return data;
  if (data.error) return data.error;
  // Collect all field errors (arrays or strings)
  return Object.values(data)
    .flat()
    .join(" ");
}

function LoginModal({ show, onClose }) {
  // State
  const [step, setStep] = useState("email"); // email, password, otp, totp, setPassword, googleAuth, success
  const [loginEmail, setLoginEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [action, setAction] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValidations, setPasswordValidations] = useState({});
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [totp, setTotp] = useState("");
  const [totpError, setTotpError] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [loading, setLoading] = useState(false);

  // Password reset states
  const [resetStep, setResetStep] = useState(null); // null, "request", "otp", "password", "success"
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // Reset on close
  useEffect(() => {
    if (!show) {
      setStep("email");
      setLoginEmail("");
      setErrorMessage("");
      setAction("");
      setPassword("");
      setShowPassword(false);
      setPasswordValidations({});
      setConfirmPassword("");
      setOtp("");
      setOtpError("");
      setOtpSent(false);
      setTotp("");
      setTotpError("");
      setQrCodeUrl("");
      setLoading(false);

      setResetStep(null);
      setResetEmail("");
      setResetOtp("");
      setResetPassword("");
      setResetError("");
      setResetLoading(false);
    }
  }, [show]);

  // Password validation (visual only)
  useEffect(() => {
    if (step === "setPassword") {
      const validations = {};
      PASSWORD_VALIDATORS.forEach(v => {
        validations[v.key] = v.test(password);
      });
      setPasswordValidations(validations);
    }
  }, [password, step]);

  // Step transitions
  const goToStep = s => {
    setErrorMessage("");
    setOtpError("");
    setTotpError("");
    setStep(s);
  };

  // Email submit
  const submitEmail = async e => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);
    try {
      const { data } = await api.post("/account/login/", { email: loginEmail });
      if (data.action === "set_password and register Authenticator") {
        setAction(data.action);
        goToStep("setPassword");
      } else if (data.action === "login_password_or_otp_or_google_authenticator") {
        setAction(data.action);
        goToStep("password");
      } else {
        setErrorMessage("Unexpected response from the server.");
      }
    } catch (err) {
      setErrorMessage(extractBackendError(err));
    }
    setLoading(false);
  };

  // Password login
  const submitPassword = async e => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);
    try {
      await api.post("/account/login/", {
        email: loginEmail,
        password,
      });
      goToStep("success");
    } catch (err) {
      setErrorMessage(extractBackendError(err));
    }
    setLoading(false);
  };

  // OTP request
  const sendLoginOtp = async () => {
    setErrorMessage("");
    setLoading(true);
    try {
      await api.post("/account/login-otp-request/", { email: loginEmail });
      setOtpSent(true);
      setErrorMessage("OTP sent to your email.");
      goToStep("otp");
    } catch (err) {
      setErrorMessage(extractBackendError(err));
    }
    setLoading(false);
  };

  // OTP login
  const submitOtp = async e => {
    e.preventDefault();
    setOtpError("");
    setLoading(true);
    try {
      await api.post("/account/login/", {
        email: loginEmail,
        otp,
      });
      goToStep("success");
    } catch (err) {
      setOtpError(extractBackendError(err));
    }
    setLoading(false);
  };

  // TOTP login
  const submitTotp = async e => {
    e.preventDefault();
    setTotpError("");
    setLoading(true);
    try {
      await api.post("/account/login/", {
        email: loginEmail,
        totp,
      });
      goToStep("success");
    } catch (err) {
      setTotpError(extractBackendError(err));
    }
    setLoading(false);
  };

  // Set password + register Google Authenticator
  const submitSetPassword = async e => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);
    try {
      await api.post("/account/set-password/", {
        email: loginEmail,
        password,
      });
      // Auto-login after setting password
      await api.post("/account/login/", {
        email: loginEmail,
        password,
      });
      // Register Google Authenticator
      const { data } = await api.post("/account/google-auth/register/");
      setQrCodeUrl(data.qr_code_url);
      goToStep("googleAuth");
    } catch (err) {
      setErrorMessage(extractBackendError(err));
    }
    setLoading(false);
  };

  // UI
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
      style={{ background: overlayBg }}
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

        {/* Only show login steps if not in reset mode */}
        {!resetStep && (
          <>
            {/* Step: Email */}
            {step === "email" && (
              <>
                <div className="flex flex-col items-center mb-6">
                  <div className="p-3 rounded-full mb-2" style={{ background: iconBg }}>
                    <FiMail className="text-white text-3xl" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2" style={{ color: textColor }}>
                    Login to your account
                  </h2>
                  <p className="text-center" style={{ color: subTextColor }}>
                    Enter your <b>@narayanagroup.com</b> email to continue.
                  </p>
                </div>
                <form onSubmit={submitEmail} className="space-y-4">
                  <div className="relative">
                    <FiMail className="absolute left-3 top-3" style={{ color: inputBorder }} />
                    <input
                      className="w-full pl-10 pr-4 py-3 rounded-xl border outline-none text-lg"
                      style={{
                        border: `1px solid ${inputBorder}`,
                        background: "#fff",
                      }}
                      placeholder="Email"
                      type="email"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      required
                      autoFocus
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
                    {loading ? "Checking..." : "Continue"}
                  </button>
                  {errorMessage && (
                    <div style={{ color: errorColor }} className="text-center mt-2">
                      {errorMessage}
                    </div>
                  )}
                </form>
              </>
            )}

            {/* Step: Password/OTP/TOTP choice */}
            {step === "password" && (
              <>
                <div className="flex flex-col items-center mb-6">
                  <div className="p-3 rounded-full mb-2" style={{ background: iconBg }}>
                    <FiLock className="text-white text-3xl" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2" style={{ color: textColor }}>
                    Enter your password
                  </h2>
                  <p className="text-center" style={{ color: subTextColor }}>
                    Or{" "}
                    <button
                      type="button"
                      className="underline font-semibold"
                      style={{ color: "#2196f3" }}
                      onClick={sendLoginOtp}
                      disabled={loading}
                    >
                      Login with OTP
                    </button>
                    {" / "}
                    <button
                      type="button"
                      className="underline font-semibold"
                      style={{ color: "#7c4dff" }}
                      onClick={() => goToStep("totp")}
                      disabled={loading}
                    >
                      Google Authenticator
                    </button>
                    <br />
                    <button
                      type="button"
                      className="underline font-semibold mt-2"
                      style={{ color: "#d32f2f" }}
                      onClick={() => {
                        setResetStep("request");
                        setResetEmail(loginEmail);
                        setResetError("");
                      }}
                      disabled={loading}
                    >
                      Forgot password?
                    </button>
                  </p>
                </div>
                <form onSubmit={submitPassword} className="space-y-4">
                  <div className="relative">
                    <FiLock className="absolute left-3 top-3" style={{ color: inputBorder }} />
                    <input
                      className="w-full pl-10 pr-12 py-3 rounded-xl border outline-none text-lg"
                      style={{
                        border: `1px solid ${inputBorder}`,
                        background: "#fff",
                      }}
                      placeholder="Password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      autoFocus
                      onFocus={e =>
                        (e.target.style.boxShadow = `0 0 0 2px ${inputFocus}33`)
                      }
                      onBlur={e => (e.target.style.boxShadow = "none")}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-3 text-xl"
                      style={{ color: inputBorder }}
                      tabIndex={-1}
                      onClick={() => setShowPassword(v => !v)}
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
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
                    disabled={loading}
                  >
                    {loading ? "Logging in..." : "Login"}
                  </button>
                  {errorMessage && (
                    <div style={{ color: errorColor }} className="text-center mt-2">
                      {errorMessage}
                    </div>
                  )}
                </form>
              </>
            )}

            {/* Step: OTP */}
            {step === "otp" && (
              <>
                <div className="flex flex-col items-center mb-6">
                  <div className="p-3 rounded-full mb-2" style={{ background: iconBg }}>
                    <FiKey className="text-white text-3xl" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2" style={{ color: textColor }}>
                    Enter OTP
                  </h2>
                  <p className="text-center" style={{ color: subTextColor }}>
                    Enter the OTP sent to <b>{loginEmail}</b>
                  </p>
                </div>
                <form onSubmit={submitOtp} className="space-y-4">
                  <input
                    className="w-full px-4 py-3 rounded-xl border outline-none text-lg text-center"
                    style={{
                      border: `1px solid ${otpBorder}`,
                      background: "#fff",
                    }}
                    placeholder="6-digit OTP"
                    maxLength={6}
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                    required
                    autoFocus
                    onFocus={e =>
                      (e.target.style.boxShadow = `0 0 0 2px ${otpFocus}33`)
                    }
                    onBlur={e => (e.target.style.boxShadow = "none")}
                  />
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
                    {loading ? "Verifying..." : "Verify OTP"}
                  </button>
                  {otpError && (
                    <div style={{ color: errorColor }} className="text-center mt-2">
                      {otpError}
                    </div>
                  )}
                  <div className="text-center mt-2">
                    <button
                      type="button"
                      className="underline font-semibold"
                      style={{ color: "#2196f3" }}
                      onClick={sendLoginOtp}
                      disabled={loading}
                    >
                      Resend OTP
                    </button>
                  </div>
                  {errorMessage && (
                    <div style={{ color: successColor }} className="text-center mt-2">
                      {errorMessage}
                    </div>
                  )}
                </form>
              </>
            )}

            {/* Step: TOTP (Google Authenticator) */}
            {step === "totp" && (
              <>
                <div className="flex flex-col items-center mb-6">
                  <div className="p-3 rounded-full mb-2" style={{ background: iconBg }}>
                    <FiShield className="text-white text-3xl" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2" style={{ color: textColor }}>
                    Google Authenticator
                  </h2>
                  <p className="text-center" style={{ color: subTextColor }}>
                    Enter the 6-digit code from your Google Authenticator app.
                  </p>
                </div>
                <form onSubmit={submitTotp} className="space-y-4">
                  <input
                    className="w-full px-4 py-3 rounded-xl border outline-none text-lg text-center"
                    style={{
                      border: `1px solid ${otpBorder}`,
                      background: "#fff",
                    }}
                    placeholder="6-digit code"
                    maxLength={6}
                    value={totp}
                    onChange={e => setTotp(e.target.value.replace(/\D/g, ""))}
                    required
                    autoFocus
                    onFocus={e =>
                      (e.target.style.boxShadow = `0 0 0 2px ${otpFocus}33`)
                    }
                    onBlur={e => (e.target.style.boxShadow = "none")}
                  />
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
                    {loading ? "Verifying..." : "Verify"}
                  </button>
                  {totpError && (
                    <div style={{ color: errorColor }} className="text-center mt-2">
                      {totpError}
                    </div>
                  )}
                </form>
              </>
            )}

            {/* Step: Set Password + Register Google Authenticator */}
            {step === "setPassword" && (
              <>
                <div className="flex flex-col items-center mb-6">
                  <div className="p-3 rounded-full mb-2" style={{ background: iconBg }}>
                    <FiLock className="text-white text-3xl" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2" style={{ color: textColor }}>
                    Set your password
                  </h2>
                  <p className="text-center" style={{ color: subTextColor }}>
                    Create a strong password to secure your account.
                  </p>
                </div>
                <form onSubmit={submitSetPassword} className="space-y-4">
                  <div className="relative">
                    <FiLock className="absolute left-3 top-3" style={{ color: inputBorder }} />
                    <input
                      className="w-full pl-10 pr-12 py-3 rounded-xl border outline-none text-lg"
                      style={{
                        border: `1px solid ${inputBorder}`,
                        background: "#fff",
                      }}
                      placeholder="Password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      autoFocus
                      onFocus={e =>
                        (e.target.style.boxShadow = `0 0 0 2px ${inputFocus}33`)
                      }
                      onBlur={e => (e.target.style.boxShadow = "none")}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-3 text-xl"
                      style={{ color: inputBorder }}
                      tabIndex={-1}
                      onClick={() => setShowPassword(v => !v)}
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-3" style={{ color: inputBorder }} />
                    <input
                      className="w-full pl-10 pr-4 py-3 rounded-xl border outline-none text-lg"
                      style={{
                        border: `1px solid ${inputBorder}`,
                        background: "#fff",
                      }}
                      placeholder="Confirm Password"
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      onFocus={e =>
                        (e.target.style.boxShadow = `0 0 0 2px ${inputFocus}33`)
                      }
                      onBlur={e => (e.target.style.boxShadow = "none")}
                    />
                  </div>
                  <div className="text-sm" style={{ color: subTextColor }}>
                    <ul className="list-disc ml-6">
                      {PASSWORD_VALIDATORS.map(v => (
                        <li
                          key={v.key}
                          style={{
                            color: passwordValidations[v.key] ? successColor : errorColor,
                            fontWeight: passwordValidations[v.key] ? "bold" : "normal",
                          }}
                        >
                          {v.label}
                        </li>
                      ))}
                    </ul>
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
                    {loading ? "Setting password..." : "Set Password"}
                  </button>
                  {errorMessage && (
                    <div style={{ color: errorColor }} className="text-center mt-2">
                      {errorMessage}
                    </div>
                  )}
                </form>
              </>
            )}

            {/* Step: Google Authenticator Registration (QR code) */}
            {step === "googleAuth" && (
              <div className="flex flex-col items-center justify-center py-8">
                <FiShield
                  className="mb-4"
                  style={{ color: successColor, fontSize: "3rem" }}
                />
                <h2 className="text-2xl font-bold mb-2" style={{ color: successColor }}>
                  Register Google Authenticator
                </h2>
                <p className="mb-4 text-center" style={{ color: textColor }}>
                  Scan this QR code in your Google Authenticator app.
                </p>
                {qrCodeUrl && (
                  <img
                    src={qrCodeUrl}
                    alt="Google Authenticator QR"
                    className="mb-4"
                    style={{ width: 180, height: 180, borderRadius: 12, border: `2px solid ${inputBorder}` }}
                  />
                )}
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
                  Done
                </button>
              </div>
            )}

            {/* Step: Success */}
            {step === "success" && (
              <div className="flex flex-col items-center justify-center py-12">
                <FiCheckCircle
                  className="mb-4"
                  style={{ color: successColor, fontSize: "3rem" }}
                />
                <h2 className="text-2xl font-bold mb-2" style={{ color: successColor }}>
                  Login Successful!
                </h2>
                <p className="mb-6 text-center" style={{ color: textColor }}>
                  You are now logged in.
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
          </>
        )}

        {/* Password Reset: Request OTP */}
        {resetStep === "request" && (
          <>
            <div className="flex flex-col items-center mb-6">
              <div className="p-3 rounded-full mb-2" style={{ background: iconBg }}>
                <FiMail className="text-white text-3xl" />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: textColor }}>
                Reset your password
              </h2>
              <p className="text-center" style={{ color: subTextColor }}>
                Enter your <b>@narayanagroup.com</b> email to receive an OTP.
              </p>
            </div>
            <form
              onSubmit={async e => {
                e.preventDefault();
                setResetError("");
                setResetLoading(true);
                try {
                  await api.post("/account/password-reset/", { email: resetEmail });
                  setResetStep("otp");
                } catch (err) {
                  setResetError(extractBackendError(err));
                }
                setResetLoading(false);
              }}
              className="space-y-4"
            >
              <div className="relative">
                <FiMail className="absolute left-3 top-3" style={{ color: inputBorder }} />
                <input
                  className="w-full pl-10 pr-4 py-3 rounded-xl border outline-none text-lg"
                  style={{
                    border: `1px solid ${inputBorder}`,
                    background: "#fff",
                  }}
                  placeholder="Email"
                  type="email"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  required
                  autoFocus
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
                disabled={resetLoading}
              >
                {resetLoading ? "Sending OTP..." : "Send OTP"}
              </button>
              {resetError && (
                <div style={{ color: errorColor }} className="text-center mt-2">
                  {resetError}
                </div>
              )}
              <div className="text-center mt-2">
                <button
                  type="button"
                  className="underline font-semibold"
                  style={{ color: "#2196f3" }}
                  onClick={() => setResetStep(null)}
                >
                  Back to login
                </button>
              </div>
            </form>
          </>
        )}

        {/* Password Reset: Enter OTP */}
        {resetStep === "otp" && (
          <>
            <div className="flex flex-col items-center mb-6">
              <div className="p-3 rounded-full mb-2" style={{ background: iconBg }}>
                <FiKey className="text-white text-3xl" />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: textColor }}>
                Enter OTP
              </h2>
              <p className="text-center" style={{ color: subTextColor }}>
                Enter the OTP sent to <b>{resetEmail}</b>
              </p>
            </div>
            <form
              onSubmit={async e => {
                e.preventDefault();
                setResetError("");
                setResetLoading(true);
                try {
                  await api.post("/account/password-reset/", { email: resetEmail, otp: resetOtp });
                  setResetStep("password");
                } catch (err) {
                  setResetError(extractBackendError(err));
                }
                setResetLoading(false);
              }}
              className="space-y-4"
            >
              <input
                className="w-full px-4 py-3 rounded-xl border outline-none text-lg text-center"
                style={{
                  border: `1px solid ${otpBorder}`,
                  background: "#fff",
                }}
                placeholder="6-digit OTP"
                maxLength={6}
                value={resetOtp}
                onChange={e => setResetOtp(e.target.value.replace(/\D/g, ""))}
                required
                autoFocus
                onFocus={e =>
                  (e.target.style.boxShadow = `0 0 0 2px ${otpFocus}33`)
                }
                onBlur={e => (e.target.style.boxShadow = "none")}
              />
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
                disabled={resetLoading}
              >
                {resetLoading ? "Verifying..." : "Verify OTP"}
              </button>
              {resetError && (
                <div style={{ color: errorColor }} className="text-center mt-2">
                  {resetError}
                </div>
              )}
              <div className="text-center mt-2">
                <button
                  type="button"
                  className="underline font-semibold"
                  style={{ color: "#2196f3" }}
                  onClick={() => setResetStep("request")}
                >
                  Back
                </button>
              </div>
            </form>
          </>
        )}

        {/* Password Reset: Set New Password */}
        {resetStep === "password" && (
        <>
            <div className="flex flex-col items-center mb-6">
            <div className="p-3 rounded-full mb-2" style={{ background: iconBg }}>
                <FiLock className="text-white text-3xl" />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: textColor }}>
                Set new password
            </h2>
            <p className="text-center" style={{ color: subTextColor }}>
                Enter your new password for <b>{resetEmail}</b>
            </p>
            </div>
            <form
            onSubmit={async e => {
                e.preventDefault();
                setResetError("");
                setResetLoading(true);
                try {
                await api.post("/account/password-reset/", {
                    email: resetEmail,
                    otp: resetOtp,
                    password: resetPassword,
                });
                setResetStep("success");
                } catch (err) {
                setResetError(extractBackendError(err));
                }
                setResetLoading(false);
            }}
            className="space-y-4"
            >
            <div className="relative">
                <FiLock className="absolute left-3 top-3" style={{ color: inputBorder }} />
                <input
                className="w-full pl-10 pr-12 py-3 rounded-xl border outline-none text-lg"
                style={{
                    border: `1px solid ${inputBorder}`,
                    background: "#fff",
                }}
                placeholder="New Password"
                type={showPassword ? "text" : "password"}
                value={resetPassword}
                onChange={e => setResetPassword(e.target.value)}
                required
                autoFocus
                onFocus={e =>
                    (e.target.style.boxShadow = `0 0 0 2px ${inputFocus}33`)
                }
                onBlur={e => (e.target.style.boxShadow = "none")}
                />
                <button
                type="button"
                className="absolute right-3 top-3 text-xl"
                style={{ color: inputBorder }}
                tabIndex={-1}
                onClick={() => setShowPassword(v => !v)}
                >
                {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
            </div>
            <div className="text-sm" style={{ color: subTextColor }}>
                <ul className="list-disc ml-6">
                {PASSWORD_VALIDATORS.map(v => (
                    <li
                    key={v.key}
                    style={{
                        color: v.test(resetPassword) ? successColor : errorColor,
                        fontWeight: v.test(resetPassword) ? "bold" : "normal",
                    }}
                    >
                    {v.label}
                    </li>
                ))}
                </ul>
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
                disabled={resetLoading}
            >
                {resetLoading ? "Resetting..." : "Reset Password"}
            </button>
            {resetError && (
                <div style={{ color: errorColor }} className="text-center mt-2">
                {resetError}
                </div>
            )}
            <div className="text-center mt-2">
                <button
                type="button"
                className="underline font-semibold"
                style={{ color: "#2196f3" }}
                onClick={() => setResetStep("otp")}
                >
                Back
                </button>
            </div>
            </form>
        </>
        )}

        {/* Password Reset: Success */}
        {resetStep === "success" && (
          <div className="flex flex-col items-center justify-center py-12">
            <FiCheckCircle
              className="mb-4"
              style={{ color: successColor, fontSize: "3rem" }}
            />
            <h2 className="text-2xl font-bold mb-2" style={{ color: successColor }}>
              Password Reset Successful!
            </h2>
            <p className="mb-6 text-center" style={{ color: textColor }}>
              You can now log in with your new password.
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
              onClick={() => {
                setResetStep(null);
                setStep("password");
                setResetEmail("");
                setResetOtp("");
                setResetPassword("");
                setResetError("");
              }}
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default LoginModal;