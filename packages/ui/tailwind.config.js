module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          saffron: '#FF6B09',
          orange: '#FF5722',
          accent: '#FF8A50',
        },
        dark: {
          bg: '#0F172A',      // Slate 900
          surface: '#1E293B', // Slate 800
          border: '#334155',  // Slate 700
          text: '#F8FAFC',    // Slate 50
          muted: '#94A3B8',   // Slate 400
        }
      },
    },
  },
  plugins: [],
};
