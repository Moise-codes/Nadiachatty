/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      animation: {
        'fade-in':    'fadeIn 0.3s ease forwards',
        'slide-up':   'slideUp 0.35s ease forwards',
        'pulse-ring': 'pulseRing 1.5s ease-out infinite',
        'bounce-dot': 'bounceDot 1.2s infinite ease-in-out both'
      },
      keyframes: {
        fadeIn:    { from:{opacity:0}, to:{opacity:1} },
        slideUp:   { from:{opacity:0,transform:'translateY(12px)'}, to:{opacity:1,transform:'translateY(0)'} },
        pulseRing: { '0%':{transform:'scale(0.8)',opacity:1}, '100%':{transform:'scale(2.4)',opacity:0} },
        bounceDot: { '0%,80%,100%':{transform:'scale(0)'}, '40%':{transform:'scale(1)'} }
      }
    }
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [{
      nadiadark: {
        'primary':         '#7c3aed',
        'primary-focus':   '#6d28d9',
        'primary-content': '#ffffff',
        'secondary':       '#9333ea',
        'accent':          '#22c55e',
        'neutral':         '#0a0a14',
        'base-100':        '#000000',
        'base-200':        '#0a0a14',
        'base-300':        '#12121e',
        'base-content':    '#e2e8f0',
        'info':    '#3b82f6',
        'success': '#22c55e',
        'warning': '#f59e0b',
        'error':   '#ef4444'
      }
    }],
    darkTheme: 'nadiadark'
  }
}
