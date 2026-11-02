/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Text',
          'system-ui',
          'sans-serif',
        ],
      },
      colors: {
        iosbg: '#f2f2f7',
        ioscard: '#ffffff',
        iosblue: '#007aff',
        iosgreen: '#34c759',
        iosred: '#ff3b30',
        iosorange: '#ff9500',
        iosgray: '#8e8e93',
        nl: '#ff7a00',
      },
    },
  },
  plugins: [],
}
