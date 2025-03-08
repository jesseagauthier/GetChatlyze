/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1', // Main primary color
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        secondary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6', // Main secondary color
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        neutral: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280', // Main neutral color
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e', // Main success color
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // Main warning color
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444', // Main danger color
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Merriweather', 'ui-serif', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        display: ['Poppins', 'sans-serif'],
      },
      borderRadius: {
        sm: '0.125rem',
        DEFAULT: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        none: 'none',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [
    function ({ addComponents }) {
      addComponents({
        // Custom Button Styles
        '.btn': {
          padding: '0.5rem 1rem',
          borderRadius: '0.375rem',
          fontWeight: '500',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 150ms ease-in-out',
          cursor: 'pointer',
          '&:focus': {
            outline: 'none',
            boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.5)',
          },
        },
        '.btn-primary': {
          backgroundColor: '#6366f1',
          color: 'white',
          '&:hover': {
            backgroundColor: '#4f46e5',
          },
          '&:active': {
            backgroundColor: '#4338ca',
          },
        },
        '.btn-secondary': {
          backgroundColor: '#14b8a6',
          color: 'white',
          '&:hover': {
            backgroundColor: '#0d9488',
          },
          '&:active': {
            backgroundColor: '#0f766e',
          },
        },
        '.btn-outline': {
          backgroundColor: 'transparent',
          borderWidth: '1px',
          borderColor: '#6366f1',
          color: '#6366f1',
          '&:hover': {
            backgroundColor: '#6366f1',
            color: 'white',
          },
        },
        '.btn-danger': {
          backgroundColor: '#ef4444',
          color: 'white',
          '&:hover': {
            backgroundColor: '#dc2626',
          },
        },
        '.btn-sm': {
          padding: '0.25rem 0.5rem',
          fontSize: '0.875rem',
          lineHeight: '1.25rem',
        },
        '.btn-lg': {
          padding: '0.75rem 1.5rem',
          fontSize: '1.125rem',
          lineHeight: '1.75rem',
        },

        // Custom Input Styles
        '.form-input': {
          display: 'block',
          width: '100%',
          padding: '0.5rem 0.75rem',
          borderWidth: '1px',
          borderColor: '#d1d5db',
          borderRadius: '0.375rem',
          backgroundColor: '#fff',
          color: '#1f2937',
          '&:focus': {
            outline: 'none',
            borderColor: '#6366f1',
            boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.25)',
          },
          '&::placeholder': {
            color: '#9ca3af',
          },
          '&:disabled': {
            backgroundColor: '#f3f4f6',
            opacity: '0.75',
            cursor: 'not-allowed',
          },
        },

        // Custom Card Styles
        '.card': {
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          overflow: 'hidden',
        },
        '.card-header': {
          padding: '1rem 1.5rem',
          borderBottomWidth: '1px',
          borderColor: '#e5e7eb',
        },
        '.card-body': {
          padding: '1.5rem',
        },
        '.card-footer': {
          padding: '1rem 1.5rem',
          borderTopWidth: '1px',
          borderColor: '#e5e7eb',
        },

        // Chat Specific Components
        '.chat-bubble': {
          maxWidth: '75%',
          padding: '0.75rem 1rem',
          borderRadius: '0.75rem',
          marginBottom: '0.5rem',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        },
        '.chat-bubble-user': {
          backgroundColor: '#6366f1',
          color: 'white',
          borderBottomRightRadius: '0.125rem',
          marginLeft: 'auto',
        },
        '.chat-bubble-agent': {
          backgroundColor: '#f3f4f6',
          color: '#1f2937',
          borderBottomLeftRadius: '0.125rem',
          marginRight: 'auto',
        },
        '.chat-system-message': {
          padding: '0.5rem 0.75rem',
          borderRadius: '0.5rem',
          backgroundColor: '#f3f4f6',
          color: '#6b7280',
          fontSize: '0.875rem',
          textAlign: 'center',
          margin: '0.5rem auto',
          maxWidth: '80%',
        },
        '.typing-indicator': {
          display: 'inline-flex',
          alignItems: 'center',
          padding: '0.25rem 0.75rem',
          backgroundColor: '#f3f4f6',
          borderRadius: '0.5rem',
          color: '#6b7280',
          fontSize: '0.875rem',
        },
        '.typing-indicator-dot': {
          width: '0.375rem',
          height: '0.375rem',
          borderRadius: '9999px',
          backgroundColor: '#6b7280',
          margin: '0 0.125rem',
          animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        },

        // Status indicators
        '.status-badge': {
          display: 'inline-flex',
          alignItems: 'center',
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: '500',
        },
        '.status-online': {
          backgroundColor: '#dcfce7',
          color: '#15803d',
        },
        '.status-offline': {
          backgroundColor: '#fee2e2',
          color: '#b91c1c',
        },
        '.status-away': {
          backgroundColor: '#fef3c7',
          color: '#b45309',
        },
      })
    },
  ],
}
