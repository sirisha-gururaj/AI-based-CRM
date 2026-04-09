/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1e3a5f',
        accent:  '#2563eb',
        success: '#16a34a',
        warning: '#d97706',
        danger:  '#dc2626',
        bg:      '#f8fafc',
        sidebar: '#0f2744',
      },
    },
  },
  plugins: [],
}
