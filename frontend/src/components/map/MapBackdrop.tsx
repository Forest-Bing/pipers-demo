/**
 * 抽象地图底图：仅用于还原设计稿的视觉占位。
 * 接入高德后本组件整体移除（删除内容，保留 MapCanvas 容器）。
 */
export default function MapBackdrop() {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 1000 750"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <rect width="1000" height="750" fill="#F7F7F5" />

      {/* 绿地与水系色块 */}
      <ellipse cx="150" cy="120" rx="170" ry="130" fill="#E8F0E4" />
      <ellipse cx="905" cy="95" rx="210" ry="160" fill="#DCE9F5" />
      <ellipse cx="830" cy="705" rx="200" ry="150" fill="#E8F0E4" />
      <ellipse cx="60" cy="690" rx="150" ry="120" fill="#EFE9DE" />

      {/* 路网 */}
      <g stroke="#FFFFFF" strokeLinecap="round" fill="none">
        <path d="M-40 300 L1040 240" strokeWidth="16" />
        <path d="M120 -40 L60 790" strokeWidth="13" />
        <path d="M470 -40 L430 790" strokeWidth="9" />
        <path d="M-40 560 L1040 520" strokeWidth="9" />
        <path d="M-40 60 L1040 -20" strokeWidth="7" />
      </g>

      {/* 管道线 */}
      <g stroke="#45525E" strokeWidth="2.5" strokeLinecap="round" fill="none">
        <path d="M120 245 L700 470" />
        <path d="M420 150 L845 420" />
      </g>

      {/* 占位地名 */}
      <text x="28" y="238" fill="#9A9A9A" fontSize="13" letterSpacing="2">
        ••• ••••
      </text>
    </svg>
  )
}
