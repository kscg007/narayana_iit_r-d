// Helper function to get CSRF token cookie (needed for Django POST requests)
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

document.addEventListener('alpine:init', () => {
  Alpine.data('signupComponent', () => ({
    expanded: false,
    showSignup: false,
    otpSent: false,
    otpVerified: false,
    userName: '',
    userEmail: '',
    otpDigits: ['', '', '', '', '', ''], // 6-digit OTP array
    errorMessage: '', // For inline error messages
    timer: 300, // Timer in seconds (5 minutes)
    timerDisplay: '05:00', // Display format for the timer
    canResend: false, // Resend button state
    resendAttempts: 0, // Number of resend attempts
    maxResendAttempts: 3, // Maximum allowed resend attempts
    invalidOtpAttempts: 0, // Number of invalid OTP attempts
    maxInvalidOtpAttempts: 3, // Maximum allowed invalid OTP attempts
    otpTimerInterval: null, // To store the OTP expiration timer interval
    retryTimerInterval: null, // To store the retry timer interval
    retryTimer: 0, // To track the 10-second timer for retry
    infoMessage: '', // For displaying temporary info messages
    successMessage: '', // Stores the success message from the backend



    

    // Initialize the component
    init() {
      window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && this.showSignup) {
          this.closeSignup();
        }
      });
    },

    // Start the OTP expiration timer (5 minutes)
    startTimer() {
      if (this.otpTimerInterval) {
        clearInterval(this.otpTimerInterval); // Clear any existing OTP timer
      }
      this.timer = 300; // Reset timer to 5 minutes
      this.updateTimerDisplay();

      // console.log('OTP Timer started'); // Debugging

      this.otpTimerInterval = setInterval(() => {
        if (this.timer > 0) {
          this.timer--;
          this.updateTimerDisplay();
          // console.log('OTP Timer:', this.timer); // Debugging
        } else {
          clearInterval(this.otpTimerInterval);
          this.canResend = true; // Enable the resend button
        }
      }, 1000);
    },

    // Update the timer display (MM:SS format)
    updateTimerDisplay() {
      const minutes = Math.floor(this.timer / 60);
      const seconds = this.timer % 60;
      this.timerDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      // console.log('Timer Display:', this.timerDisplay); // Debugging
    },

    // Start the retry timer (10 seconds)
    startRetryTimer(message) {
      if (this.retryTimerInterval) {
        clearInterval(this.retryTimerInterval); // Clear any existing retry timer
      }
      this.retryTimer = 10; // Set the timer to 10 seconds

      console.log('Retry Timer started'); // Debugging

      this.retryTimerInterval = setInterval(() => {
        if (this.retryTimer > 0) {
          this.errorMessage = `${message.replace('00:10', `00:${this.retryTimer.toString().padStart(2, '0')}`)}`;
          this.retryTimer--;
          console.log('Retry Timer:', this.retryTimer); // Debugging
        } else {
          clearInterval(this.retryTimerInterval);
          this.resetSignup(); // Reset the signup process after 10 seconds
        }
      }, 1000);
    },

    // Send OTP
    sendOtp() {
      this.errorMessage = ''; // Clear previous errors

      // Call the backend API to send OTP
      fetch('/account/signup/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
        },
        body: JSON.stringify({
          name: this.userName,
          email: this.userEmail,
        }),
      })
        .then(async response => {
          if (!response.ok) {
            // Extract backend errors and display them
            const errorData = await response.json();
            const firstError = Object.values(errorData)[0];
            this.errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
            throw new Error('Validation error'); // Throw an error to trigger the catch block
          }
          return response.json();
        })
        .then(data => {
          // OTP sent successfully
          this.otpSent = true;
          this.otpDigits = ['', '', '', '', '', '']; // Reset OTP digits
          this.errorMessage = ''; // Clear errors on success
          this.canResend = false; // Disable resend button
          this.startTimer(); // Start the OTP expiration timer

          // Focus on the first OTP input box
          this.$nextTick(() => {
            const otpInputs = document.querySelectorAll('[x-ref="otpInput"]');
            if (otpInputs.length > 0) {
              otpInputs[0].focus(); // Focus on the first OTP input box
            }
          });
        })
        .catch(error => {
          console.error('Send OTP error:', error);
          // Backend error is already set in `this.errorMessage`
        });
    },

    // Resend OTP
    resendOtp() {
      if (this.resendAttempts >= this.maxResendAttempts) {
        // Set the error message immediately
        this.errorMessage = 'Maximum resend attempts exceeded.<br>Try Sign up again in 10 seconds.<br>';
        this.startRetryTimer('Maximum resend attempts exceeded.<br>Try Sign up again in 00:10 seconds.<br>');
        return;
      }

      this.resendAttempts++;
      this.canResend = false; // Disable the resend button
      this.startTimer(); // Restart the OTP expiration timer

      // Call the API to resend the OTP
      fetch('/account/signup/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
        },
        body: JSON.stringify({
          name: this.userName,
          email: this.userEmail,
        }),
      })
        .then(async response => {
          if (!response.ok) {
            const errorData = await response.json();
            const firstError = Object.values(errorData)[0];
            this.errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
            throw new Error('Validation error');
          }
          return response.json();
        })
        .then(data => {
          this.otpDigits = ['', '', '', '', '', '']; // Reset OTP digits
          this.errorMessage = ''; // Clear errors on success

          // Set the info message
          this.infoMessage = `OTP sent successfully.<br>Check your mail "${this.userEmail}"`;

          // Clear the info message after 5 seconds
          setTimeout(() => {
            this.infoMessage = '';
          }, 5000);

          // Focus on the first OTP input box
          this.$nextTick(() => {
            const otpInputs = document.querySelectorAll('[x-ref="otpInput"]');
            if (otpInputs.length > 0) {
              otpInputs[0].focus();
            }
          });
        })
        .catch(error => {
          console.error('Resend OTP error:', error);

          // Only show the backend error if the maximum resend attempts are not exceeded
          if (this.resendAttempts < this.maxResendAttempts) {
            this.errorMessage = 'Failed to resend OTP. Please try again later.';
          }
        });
    },

    // Handle OTP paste event
    onOtpPaste(event) {
      event.preventDefault(); // Prevent the default paste behavior

      const pastedData = (event.clipboardData || window.clipboardData).getData('text'); // Get the pasted value
      const digits = pastedData.split('').filter(char => /^\d$/.test(char)); // Extract only numeric characters

      // Distribute the digits across the OTP input boxes
      digits.forEach((digit, index) => {
        if (index < this.otpDigits.length) {
          this.otpDigits[index] = digit;
        }
      });

      // Focus the next empty input box
      this.$nextTick(() => {
        const otpInputs = document.querySelectorAll('[x-ref="otpInput"]');
        const nextEmptyIndex = digits.length < this.otpDigits.length ? digits.length : this.otpDigits.length - 1;
        if (otpInputs[nextEmptyIndex]) {
          otpInputs[nextEmptyIndex].focus();
        }
      });
    },

    // Handle input for each OTP box
    onOtpInput(index, event) {
      const value = event.target.value;

      // Allow only a single digit (0-9)
      if (!/^\d$/.test(value)) {
        this.otpDigits[index] = ''; // Clear invalid input
        return;
      }

      this.otpDigits[index] = value; // Update the digit in the array

      // Use querySelectorAll to manage focus
      const otpInputs = document.querySelectorAll('[x-ref="otpInput"]');

      // Check if the next input box exists
      if (otpInputs[index + 1]) {
        this.$nextTick(() => {
          otpInputs[index + 1].focus();
        });
      }
    },

    // Combine all OTP digits into a single string
    otpInput() {
      return this.otpDigits.join('');
    },

    // Handle backspace for OTP input
    onOtpBackspace(index, event) {
      if (event.key === 'Backspace') {
        const otpInputs = document.querySelectorAll('[x-ref="otpInput"]');

        if (this.otpDigits[index] === '') {
          // Move focus to the previous input box if it exists
          if (otpInputs[index - 1]) {
            this.$nextTick(() => {
              otpInputs[index - 1].focus();
            });
          }
        } else {
          // Clear the current input
          this.otpDigits[index] = '';
        }
      }
    },

    // Verify OTP
    verifyOtp() {
      this.errorMessage = ''; // Clear previous errors
    
      // Ensure the OTP is complete
      if (this.otpInput().length < 6) {
        this.errorMessage = 'Please enter the complete 6-digit OTP.';
        return;
      }
    
      // Call the backend to verify the OTP
      fetch('/account/otp-verify/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
        },
        body: JSON.stringify({
          email: this.userEmail, // Use the stored email
          otp: this.otpInput(), // Combine OTP digits into a single string
        }),
      })
        .then(async response => {
          if (!response.ok) {
            const errorData = await response.json();
            const firstError = Object.values(errorData)[0]; // Extract the first error message
    
            // Increment invalid OTP attempts
            this.invalidOtpAttempts++;
            if (this.invalidOtpAttempts >= this.maxInvalidOtpAttempts) {
              // Set the error message immediately and start retry timer
              this.errorMessage = 'Maximum attempts exceeded.<br>Try Sign up again in 00:10 seconds.<br>';
              this.startRetryTimer(this.errorMessage);
            } else {
              // Show "Invalid OTP" and remaining attempts in a single message
              const attemptsLeft = this.maxInvalidOtpAttempts - this.invalidOtpAttempts;
              this.errorMessage = `Invalid OTP. You have ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} left.`;
            }
    
            throw new Error(firstError || 'Validation error'); // Throw to trigger catch block
          }
          return response.json();
        })
        .then(data => {
          // OTP verified successfully
          this.otpVerified = true; // Show the success template
          this.successMessage = data.message; // Set the success message from the backend
        })
        .catch(error => {
          console.error('OTP verification error:', error);
          // Only update generic error message if max attempts not reached
          if (this.invalidOtpAttempts < this.maxInvalidOtpAttempts) {
            // Do nothing here — errorMessage is already set above
          }
        });
    },

    closeSignup() {
      this.showSignup = false;
      this.otpSent = false;
      this.otpVerified = false;
      this.userName = '';
      this.userEmail = '';
      this.otpDigits = ['', '', '', '', '', ''];
      this.errorMessage = '';
      this.successMessage = ''; // Clear the success message
      this.timer = 300; // Reset timer
      this.timerDisplay = '05:00'; // Reset timer display
      this.canResend = false; // Reset resend button state
      this.resendAttempts = 0; // Reset resend attempts
      this.invalidOtpAttempts = 0; // Reset invalid OTP attempts
    
      // Clear both timers
      if (this.otpTimerInterval) {
        clearInterval(this.otpTimerInterval);
        this.otpTimerInterval = null;
      }
      if (this.retryTimerInterval) {
        clearInterval(this.retryTimerInterval);
        this.retryTimerInterval = null;
      }
    },

    // Reset Signup
    resetSignup() {
      this.showSignup = false;
      this.otpSent = false;
      this.otpVerified = false;
      this.userName = '';
      this.userEmail = '';
      this.otpDigits = ['', '', '', '', '', ''];
      this.errorMessage = '';
      this.timer = 300; // Reset timer
      this.timerDisplay = '05:00'; // Reset timer display
      this.canResend = false; // Reset resend button state
      this.resendAttempts = 0; // Reset resend attempts
      this.invalidOtpAttempts = 0; // Reset invalid OTP attempts

      // Clear both timers
      if (this.otpTimerInterval) {
        clearInterval(this.otpTimerInterval);
        this.otpTimerInterval = null;
      }
      if (this.retryTimerInterval) {
        clearInterval(this.retryTimerInterval);
        this.retryTimerInterval = null;
      }
    },
  }));
});