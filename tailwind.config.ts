import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        hand: ['"Dancing Script"', 'cursive'],
        serif: ['"Playfair Display"', 'serif'],
        sans: ['"Montserrat"', 'sans-serif'],
        typewriter: ['"Special Elite"', 'monospace'],
        neon: ['"Courier Prime"', 'monospace'],
      },
      colors: {
        paper: '#fdfbf7',
        'glass-edge': 'rgba(255, 255, 255, 0.6)',
        'glass-surface': 'rgba(255, 255, 255, 0.1)',
        'glass-shadow': 'rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    }
  },
  plugins: [],
} satisfies Config
