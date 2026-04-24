import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        magenta: '#ff2d6f',
        amber: '#ffc107',
        lime: '#a8ff60',
        ink: '#0a0510',
      },
      fontFamily: {
        display: ["'Bungee'", 'cursive'],
        mono: ["'IBM Plex Mono'", 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
