/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f0f0ff',
                    100: '#e0e0ff',
                    200: '#c7c7ff',
                    300: '#a3a3ff',
                    400: '#8080ff',
                    500: '#667eea',
                    600: '#5a67d8',
                    700: '#4c51bf',
                    800: '#434190',
                    900: '#3c366b',
                },
                accent: {
                    purple: '#764ba2',
                    cyan: '#00f2fe',
                    blue: '#4facfe',
                    pink: '#f093fb',
                    coral: '#f5576c',
                    peach: '#fcb69f',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-out',
                'fade-in-up': 'fadeInUp 0.4s ease-out',
                'slide-in-right': 'slideInRight 0.3s ease-out',
                'slide-in-left': 'slideInLeft 0.3s ease-out',
                'scale-in': 'scaleIn 0.2s ease-out',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'shimmer': 'shimmer 2s linear infinite',
                'spin-slow': 'spin 2s linear infinite',
                'bounce-subtle': 'bounceSubtle 1s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideInRight: {
                    '0%': { opacity: '0', transform: 'translateX(100%)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                slideInLeft: {
                    '0%': { opacity: '0', transform: 'translateX(-100%)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                scaleIn: {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                bounceSubtle: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-5px)' },
                },
            },
            boxShadow: {
                'glass': '0 8px 32px rgba(0, 0, 0, 0.1)',
                'glass-lg': '0 16px 48px rgba(0, 0, 0, 0.15)',
                'glow': '0 0 20px rgba(102, 126, 234, 0.3)',
                'glow-lg': '0 0 40px rgba(102, 126, 234, 0.4)',
            },
            backdropBlur: {
                'xs': '2px',
            },
            backgroundImage: {
                'gradient-primary': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                'gradient-secondary': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                'gradient-accent': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                'gradient-warm': 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                'gradient-cool': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                'gradient-dark': 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            },
        },
    },
    plugins: [],
}
