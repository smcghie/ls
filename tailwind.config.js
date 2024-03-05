/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
	],
  theme: {
    container: {
      center: true,
      padding: "",
      screens: {
        "2xl": "1400px",
      },
    },
    fontSize: {
      "heading-bold": [
        "30px",
        {
          lineHeight: "140%",
          fontWeight: "700",
        },
      ],
      "heading2-bold": [
        "24px",
        {
          lineHeight: "140%",
          fontWeight: "700",
        },
      ],
      "body-bold": [
        "18px",
        {
          lineHeight: "140%",
          fontWeight: "700",
        },
      ],
      "base-regular": [
        "16px",
        {
          lineHeight: "140%",
          fontWeight: "400",
        },
      ],
      "base-medium": [
        "16px",
        {
          lineHeight: "140%",
          fontWeight: "500",
        },
      ],
      "base-semibold": [
        "16px",
        {
          lineHeight: "140%",
          fontWeight: "600",
        },
      ],
      "small-regular": [
        "14px",
        {
          lineHeight: "140%",
          fontWeight: "400",
        },
      ],
      "small-semibold": [
        "14px",
        {
          lineHeight: "140%",
          fontWeight: "600",
        },
      ],
      "subtle-medium": [
        "12px",
        {
          lineHeight: "16px",
          fontWeight: "500",
        },
      ],
      "subtle-semibold": [
        "12px",
        {
          lineHeight: "16px",
          fontWeight: "600",
        },
      ],
      "tiny-medium": [
        "10px",
        {
          lineHeight: "140%",
          fontWeight: "500",
        },
      ],
    },
    extend: {
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      colors: {
        "dark-1": "#030C1A",
        "dark-2": "#010813",
        "dark-4" : "#1F1F22",
        "light-1": "#EFEFEF",
        "light-2": "#EFEFEF",
        "gray-1": "#475569",
        "gray-2": "#B8BFC9",
        "gray-3": "#818FA2",
        "tb-1": "#021B36",
        "tb-2": "#183C61",
        "tb-3": "#516D88",
        "tb-4": "#293b4d",
        "pink-1": "#EA2CB3",
        "pink-2": "#FF22B9",
        "pink-3": "#7D5B95",
      },
      gridTemplateColumns: {
        'auto-fill': 'repeat(auto-fill, minmax(100px, 1fr))',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}