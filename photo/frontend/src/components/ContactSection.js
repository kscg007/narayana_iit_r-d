import React from "react";

const socials = [
  {
    name: "Facebook",
    url: "https://facebook.com/narayanaedu",
    img: "/static/images/Socials/fb2.svg"
  },
  {
    name: "Instagram",
    url: "https://www.instagram.com/thenarayanagroup/",
    img: "/static/images/Socials/insta2.svg"
  },
  {
    name: "YouTube",
    url: "https://www.youtube.com/user/thenarayanagroup",
    img: "/static/images/Socials/youtube2.svg"
  },
  {
    name: "Website",
    url: "https://www.narayanagroup.com/",
    img: "/static/images/Socials/website.svg"
  }
];

function Footer() {
  return (
    <footer className="w-full py-6 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500">
      <div className="container mx-auto flex justify-center items-center gap-6">
        {socials.map((s) => (
          <a
            key={s.name}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={s.name}
            className="transition hover:scale-110"
          >
            <img
              src={s.img}
              alt={s.name}
              className="w-8 h-8 object-contain"
              style={{ display: "inline-block" }}
            />
          </a>
        ))}
      </div>
    </footer>
  );
}

export default Footer;