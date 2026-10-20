import colors from "tailwindcss/colors.d.ts";

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Tweak in M6 (tag-style) and M8 (due-tint)
        feature: '#10B981', // emerald
        bug: '#DC2626',     // crimson
        'bg-primary': '#FFFFFF',
        'bg-secondary': '#3D3D3D',
        'text-black': '#0A0A0A',
      },
    },
  },
  plugins: [],
};
