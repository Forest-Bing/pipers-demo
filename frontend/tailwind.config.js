/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 语义色（PRD §6.1）
        alert: '#FF3B30',
        info: '#0A84FF',
        success: '#34C759',
        canvas: '#F2F2F7',
        'admin-nav': '#F7F7F9',
        ink: '#1C1C1E',
        'ink-2': '#8E8E93',
        hairline: 'rgba(60,60,67,0.12)',
        'card-line': 'rgba(60,60,67,0.08)',
        'warn-soft': '#FFF4E5',
        'warn-ink': '#B25E00',
        scrim: 'rgba(0,0,0,0.25)',
        // 地图与图层
        'map-base': '#F7F7F5',
        'map-water': '#DCE9F5',
        'map-green': '#E8F0E4',
        pipeline: '#45525E',
        stake: '#5B6B7C',
        'stake-test': '#30B0C7',
        valve: '#8E7BEF',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'PingFang SC',
          'Helvetica Neue',
          'Noto Sans SC',
          'Microsoft YaHei',
          'sans-serif',
        ],
        mono: ['ui-monospace', 'SF Mono', 'Menlo', 'Consolas', 'monospace'],
      },
      borderRadius: {
        control: '10px',
        card: '16px',
        'card-lg': '20px',
        glass: '24px',
        'glass-lg': '28px',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0,0,0,0.08)',
        'glass-inset': 'inset 0 1px 0 rgba(255,255,255,0.75)',
        fab: '0 6px 18px rgba(10,132,255,0.35)',
        pin: '0 2px 6px rgba(0,0,0,0.18)',
      },
      backdropBlur: {
        glass: '20px',
      },
      backdropSaturate: {
        glass: '180%',
      },
      transitionTimingFunction: {
        glass: 'cubic-bezier(.32,.72,0,1)',
      },
      transitionDuration: {
        240: '240ms',
        320: '320ms',
      },
      keyframes: {
        breathe: {
          '0%,100%': { opacity: '0.35', transform: 'scale(1)' },
          '50%': { opacity: '0.12', transform: 'scale(1.15)' },
        },
        'spin-slow': {
          to: { transform: 'rotate(360deg)' },
        },
        // 警告图钉内部的三角做轻微呼吸，让「告警」在原地被看见
        'alert-pulse': {
          '0%,100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.22)', opacity: '0.72' },
        },
        // 图钉外的声呐环：向外扩散并淡出
        'alert-ring': {
          '0%': { transform: 'translate(-50%,-50%) scale(0.8)', opacity: '0.55' },
          '100%': { transform: 'translate(-50%,-50%) scale(1.85)', opacity: '0' },
        },
      },
      animation: {
        breathe: 'breathe 2.4s cubic-bezier(.32,.72,0,1) infinite',
        'spin-slow': 'spin-slow 1.6s linear infinite',
        'alert-pulse': 'alert-pulse 1.6s ease-in-out infinite',
        'alert-ring': 'alert-ring 1.9s cubic-bezier(.32,.72,0,1) infinite',
      },
    },
  },
  plugins: [],
}
