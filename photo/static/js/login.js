document.addEventListener('alpine:init', () => {
    Alpine.data('loginComponent', () => ({
      showLogin: false, // Controls the visibility of the login modal
      loginEmail: '', // Stores the email entered by the user
      errorMessage: '', // Stores error messages from the API
      action: '', // Stores the action returned by the API
      showSetPassword: false, // Controls the visibility of the "Set Password" modal
      showGoogleAuth: false, // Controls the visibility of the "Google Authenticator" modal
      password: '', // Stores the password entered by the user
      confirmPassword: '', // Stores the confirm password entered by the user
      showPassword: false, // Controls the visibility of the password input
      passwordError: '', // Stores password validation error
      confirmPasswordError: '', // Stores confirm password validation error
      passwordValidations: {
        minLength: false,
        uppercase: false,
        lowercase: false,
        number: false,
        symbol: false,
      },
      qrCodeUrl:'',
      loginStep: 'password', // default login method
      prevStep: 'password',
      direction: 'right',
      setStep(step) {
        this.direction = this.getDirection(this.loginStep, step);
        this.prevStep = this.loginStep;
        this.loginStep = step;
      },
      getDirection(current, next) {
        const order = ['password', 'otp', 'totp'];
        return order.indexOf(next) > order.indexOf(current) ? 'right' : 'left';
      },
      password: '',
      otp: '',
      totp: '', // for Google Authenticator
      otpSent: false,
      passwordError: '',
      otpError: '',
      totpError: '',


      init() {
        // Listen for the global "open-login" event
        window.addEventListener('open-login', () => {
          this.showLogin = true;
        });

        // Close the modal when the Escape key is pressed
        window.addEventListener('keydown', (event) => {
          if (event.key === 'Escape' && (this.showLogin || this.showSetPassword || this.showGoogleAuth)) {
            this.closeLogin();
          }
        });

        // In your set-password modal logic, add:
        this.$watch('password', () => {
            if (this.showSetPassword) {
            this.validatePassword();
            }
        });

        // Watch for confirm password changes and validate
        this.$watch('confirmPassword', () => {
          this.validateConfirmPassword();
        });

        this.$watch('showGoogleAuth', value => {
            console.log('showGoogleAuth changed:', value);
          });

        this.$watch('loginStep', (value) => {
        if (value !== 'otp') {
            this.otpSent = false;
            this.otp = '';
            // Optionally clear error messages or other OTP-related state
            if (this.errorMessage === 'OTP sent to your email.') {
            this.errorMessage = '';
            }
        }
        });
      },

      closeLogin() {
        // Close the login modal and reset the state
        this.showLogin = false;
        this.showSetPassword = false;
        this.showGoogleAuth = false;
        this.loginEmail = '';
        this.password = '';
        this.confirmPassword = '';
        this.otp = '';
        this.totp = '';
        this.errorMessage = '';
        this.action = '';
        this.showPassword = false; // Reset password visibility
        this.passwordError = '';
        this.confirmPasswordError = '';
        this.passwordValidations = {
          minLength: false,
          uppercase: false,
          lowercase: false,
          number: false,
          symbol: false,
        };
        this.loginStep = 'password'; // Reset to default login method
        this.passwordError= '';
        this.otpError='';
        this.totpError='';
      },

      validatePassword() {
        const password = this.password;
        this.passwordValidations.minLength = password.length >= 12;
        this.passwordValidations.uppercase = /[A-Z]/.test(password);
        this.passwordValidations.lowercase = /[a-z]/.test(password);
        this.passwordValidations.number = /\d/.test(password);
        this.passwordValidations.symbol = /[!@#$%^&*()_+]/.test(password);

        // Check if all validations are true
        const allValid = Object.values(this.passwordValidations).every((v) => v);
        this.passwordError = allValid ? '' : 'Password does not meet the required criteria.';
      },

      validateConfirmPassword() {
        if (!this.confirmPassword) {
          this.confirmPasswordError = 'Confirm Password is required.';
        } else if (this.password !== this.confirmPassword) {
          this.confirmPasswordError = 'Passwords do not match.';
        } else {
          this.confirmPasswordError = '';
        }
      },

      submitEmail() {
        this.errorMessage = ''; // Clear previous errors

        // Validate the email format
        if (!this.loginEmail.endsWith('@narayanagroup.com')) {
          this.errorMessage = 'Email must be @narayanagroup.com domain';
          return;
        }

        // Call the backend API to check the email
        fetch('/account/login/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'), // Include CSRF token for Django
          },
          body: JSON.stringify({
            email: this.loginEmail,
          }),
        })
          .then(async (response) => {
            const data = await response.json();
            if (!response.ok) {
              // Display the error message from the backend
              this.errorMessage = data.error || 'An unexpected error occurred.';
              throw new Error(this.errorMessage);
            }

            // Handle the action returned by the backend
            if (data.action === 'set_password and register Authenticator') {
              this.action = 'set_password and register Authenticator';
              this.showLogin = false; // Close the login modal
              this.showSetPassword = true; // Open the "Set Password" modal
            } else if (data.action === 'login_password_or_otp_or_google_authenticator') {
                this.action = 'login_password_or_otp_or_google_authenticator';
                this.loginStep = 'password'; // default to password tab
            } else {
              this.errorMessage = 'Unexpected response from the server.';
            }
          })
          .catch(() => {
            // Error already handled above
          });
      },

      submitPassword() {
        this.passwordError = '';
        fetch('/account/login/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
          },
          body: JSON.stringify({
            email: this.loginEmail,
            password: this.password,
          }),
          credentials: 'include',
        })
          .then(async (response) => {
            const data = await response.json();
            if (!response.ok) {
              this.passwordError = data.error || 'Login failed.';
              throw new Error(this.passwordError);
            }
            this.closeLogin();
          })
          .catch(() => {});
      },
    
      sendLoginOtp() {
        this.errorMessage = '';
        fetch('/account/login-otp-request/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
          },
          body: JSON.stringify({
            email: this.loginEmail,
          }),
          credentials: 'include',
        })
          .then(async (response) => {
            const data = await response.json();
            if (!response.ok) {
              this.errorMessage = data.error || 'Failed to send OTP.';
              throw new Error(this.errorMessage);
            }
            this.otpSent = true;
            this.errorMessage = 'OTP sent to your ermail.';
          })
          .catch(() => {});
      },
    
      submitOtp() {
        this.otpError = '';
        fetch('/account/login/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
          },
          body: JSON.stringify({
            email: this.loginEmail,
            otp: this.otp,
          }),
          credentials: 'include',
        })
          .then(async (response) => {
            const data = await response.json();
            if (!response.ok) {
              this.otpError = data.error || 'OTP login failed.';
              throw new Error(this.otpError);
            }
            this.closeLogin();
          })
          .catch(() => {});
      },
    
      submitTotp() {
        this.totpError = '';
        fetch('/account/login/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
          },
          body: JSON.stringify({
            email: this.loginEmail,
            totp: this.totp,
          }),
          credentials: 'include',
        })
          .then(async (response) => {
            const data = await response.json();
            if (!response.ok) {
              this.totpError = data.error || 'Google Authenticator login failed.';
              throw new Error(this.totpError);
            }
            this.closeLogin();
          })
          .catch(() => {});
      },

      submitSetPassword() {
        this.validatePassword();
        this.validateConfirmPassword();
    
        if (this.passwordError || this.confirmPasswordError) {
          return;
        }
    
        // Call the backend API to set the password
        fetch('/account/set-password/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
          },
          body: JSON.stringify({
            email: this.loginEmail,
            password: this.password,
          }),
          credentials: 'include',
        })
          .then(async (response) => {
            const data = await response.json();
            if (!response.ok) {
              this.errorMessage = data.error || 'An unexpected error occurred.';
              throw new Error(this.errorMessage);
            }
            console.log('Password set successfully, now registering Google Authenticator...');
            // Now call the backend API to generate the QR code
            return fetch('/account/google-auth/register/', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
              },
              credentials: 'include',
            });
          })
          .then(async (response) => {
            const data = await response.json();
            if (!response.ok) {
              this.errorMessage = data.error || 'Failed to generate Google Authenticator setup.';
              throw new Error(this.errorMessage);
            }
            console.log('QR code data received:', data.qr_code_url);
            // Update the QR code in the frontend state
            this.qrCodeUrl = data.qr_code_url;
    
            // Show the Google Authenticator modal
            this.showSetPassword = false;
            this.showGoogleAuth = true;
            console.log('showGoogleAuth set to', this.showGoogleAuth);
          })
          .catch((error) => {
            console.error('SetPassword error:', error);
          });
      },

      closeGoogleAuth() {
        this.showGoogleAuth = false;
        this.qrCodeUrl = '';
      },

    }));
  });

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