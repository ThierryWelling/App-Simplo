/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Cores Principais
        background: "#FFFFFF",
        "background-secondary": "#F8F9FC",
        "text-primary": "#1A1F2E",
        "text-secondary": "#64748B",
        
        // Cores de Destaque
        primary: "#7C3AFF",
        "primary-light": "#9B6AFF",
        accent: "#4CC9F0",
        success: "#22C55E",
        error: "#EF4444",
        
        // Cores de Interface
        border: "#E2E8F0",
        input: "#F8FAFC",
        "input-focus": "#7C3AFF",
        "button-secondary": "#F1F5F9",
        "button-secondary-hover": "#E2E8F0",
        
        // Estados
        "success-bg": "#F0FDF4",
        "success-border": "#86EFAC",
        "error-bg": "#FEF2F2",
        "error-border": "#FECACA",
        "warning-bg": "#FFFBEB",
        "warning-border": "#FDE68A",
        "warning-text": "#F59E0B",
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #7C3AFF 0%, #4CC9F0 100%)',
        'gradient-hover': 'linear-gradient(135deg, #9B6AFF 0%, #60D3F7 100%)',
        'gradient-card': 'linear-gradient(180deg, #FFFFFF 0%, #F8F9FC 100%)',
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        'elevated': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        'button': '0 4px 12px rgba(124, 58, 255, 0.2)',
        'button-primary': '0 4px 12px rgba(124, 58, 255, 0.3)',
      },
      borderRadius: {
        'lg': '16px',
        'xl': '20px',
      },
      fontSize: {
        'mobile': '0.875rem',
      },
      transitionProperty: {
        'scale': 'transform',
      },
      transitionDuration: {
        '200': '200ms',
      },
      transitionTimingFunction: {
        'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      scale: {
        '102': '1.02',
        '98': '0.98',
      },
      backdropBlur: {
        'glass': '12px',
      },
      screens: {
        'mobile': '360px',
        'tablet': '640px',
        'desktop': '1024px',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} 