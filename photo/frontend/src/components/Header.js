import React, { useState } from "react";

function Header({ onSignUpClick, onLoginClick }) {
  const [menuOpen, setMenuOpen] = useState(false);

  // You can change these hex codes to your preferred colors
  const pastelBlue = "#A6D6D6";
  const darkBlue = "#1a237e";
  const white = "#ffffff";
  const pastelOrange = "#ffe5b2";
  const darkOrange = "#b26a00";
  const hoverBlue = "#bbdefb";
  const hoverOrange = "#ffecb3";
  const shadowColor = "#bdbdbd";

  return (
    <header
      style={{
        backgroundColor: pastelBlue,
        color: darkBlue,
        boxShadow: `0 2px 8px 0 ${shadowColor}`,
      }}
      className="fixed top-0 left-0 w-full z-50"
    >
      <nav className="container mx-auto flex justify-between items-center py-4 px-4 md:px-6">
        {/* Logo and Site Name */}
        <div className="flex items-center space-x-2">
          <img
            src="/static/images/logo.png"
            alt="Logo"
            className="h-12 w-12 object-contain"
          />
          <span className="text-2xl font-bold tracking-wide">
            Narayana IIT R&D
          </span>
        </div>
        {/* Hamburger Icon (Mobile Only) */}
        <button
          className="md:hidden p-2 focus:outline-none"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            // Close icon
            <svg
              className="w-7 h-7"
              fill="none"
              stroke={darkBlue}
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            // Hamburger icon
            <svg
              className="w-7 h-7"
              fill="none"
              stroke={darkBlue}
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
        {/* Desktop Menu */}
        <div className="hidden md:flex md:items-center md:space-x-8">
          <ul className="flex space-x-8 text-lg">
            <li>
              <a
                href="#about"
                style={{ color: darkBlue }}
                className="hover:underline"
              >
                About
              </a>
            </li>
            <li>
              <a
                href="#features"
                style={{ color: darkBlue }}
                className="hover:underline"
              >
                Features
              </a>
            </li>
            <li>
              <a
                href="#programs"
                style={{ color: darkBlue }}
                className="hover:underline"
              >
                Programs
              </a>
            </li>
            <li>
              <a
                href="#success"
                style={{ color: darkBlue }}
                className="hover:underline"
              >
                Success
              </a>
            </li>
            <li>
              <a
                href="#contact"
                style={{ color: darkBlue }}
                className="hover:underline"
              >
                Contact
              </a>
            </li>
          </ul>
          <div className="space-x-4 ml-8">
            <button
              style={{ backgroundColor: white, color: darkBlue }}
              className="px-4 py-2 rounded font-semibold transition"
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = hoverBlue)
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = white)
              }
              onClick={onLoginClick}
            >
              Login
            </button>
            <button
              style={{ backgroundColor: pastelOrange, color: darkOrange }}
              className="px-4 py-2 rounded font-semibold transition"
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = hoverOrange)
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = pastelOrange)
              }
              onClick={onSignUpClick}
            >
              Sign Up
            </button>
          </div>
        </div>
        {/* Mobile Menu */}
        {menuOpen && (
          <div
            style={{
              backgroundColor: pastelBlue,
              color: darkBlue,
              boxShadow: `0 2px 8px 0 ${shadowColor}`,
            }}
            className="md:hidden w-full absolute left-0 top-full z-20"
          >
            <ul className="flex flex-col text-lg py-2">
              <li>
                <a
                  href="#about"
                  style={{ color: darkBlue }}
                  className="block px-6 py-2 hover:underline"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="#features"
                  style={{ color: darkBlue }}
                  className="block px-6 py-2 hover:underline"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#programs"
                  style={{ color: darkBlue }}
                  className="block px-6 py-2 hover:underline"
                >
                  Programs
                </a>
              </li>
              <li>
                <a
                  href="#success"
                  style={{ color: darkBlue }}
                  className="block px-6 py-2 hover:underline"
                >
                  Success
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  style={{ color: darkBlue }}
                  className="block px-6 py-2 hover:underline"
                >
                  Contact
                </a>
              </li>
            </ul>
            <div className="flex flex-col space-y-2 px-6 pb-4">
              <button
                style={{ backgroundColor: white, color: darkBlue }}
                className="px-4 py-2 rounded font-semibold transition"
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = hoverBlue)
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = white)
                }
                onClick={onLoginClick}
              >
                Login
              </button>
              <button
                style={{ backgroundColor: pastelOrange, color: darkOrange }}
                className="px-4 py-2 rounded font-semibold transition"
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = hoverOrange)
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = pastelOrange)
                }
                onClick={onSignUpClick}
              >
                Sign Up
              </button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

export default Header;