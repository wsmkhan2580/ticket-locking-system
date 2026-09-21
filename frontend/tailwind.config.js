/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0A192F",
          50: "#EAF0F8",
          100: "#CBD9EB",
          400: "#38536F",
          600: "#132A45",
          900: "#0A192F",
        },
        accent: {
          DEFAULT: "#2563EB",
          50: "#EFF4FE",
          100: "#DBE6FD",
          400: "#4F83F2",
          600: "#2563EB",
          700: "#1D4FC0",
        },
        success: {
          DEFAULT: "#10B981",
          50: "#E9FBF4",
          100: "#C7F3E1",
          600: "#10B981",
          700: "#0C9367",
        },
        danger: {
          DEFAULT: "#DC2626",
          50: "#FDECEC",
          100: "#F8C9C9",
          600: "#DC2626",
          700: "#B21F1F",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "Segoe UI",
          "sans-serif",
        ],
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      transitionDuration: {
        200: "200ms",
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(10, 25, 47, 0.12)",
        "glass-sm": "0 2px 12px 0 rgba(10, 25, 47, 0.08)",
      },
    },
  },
  plugins: [],
};
