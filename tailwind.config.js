/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Rajdhani", "Orbitron", "Inter", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"]
      },
      colors: {
        void: "#05010d",
        panel: "#0f0820",
        plasma: "#7c3cff",
        violetEdge: "#b46cff",
        aquaEdge: "#18f2ff"
      },
      boxShadow: {
        neon: "0 0 28px rgba(124, 60, 255, 0.55), 0 0 72px rgba(24, 242, 255, 0.12)",
        insetGlow: "inset 0 0 40px rgba(124, 60, 255, 0.14)"
      }
    }
  },
  plugins: []
};
