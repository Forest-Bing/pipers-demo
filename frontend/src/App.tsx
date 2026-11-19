import { useState } from 'react'
import './App.css'

export default function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <h1>FullStack · React + TypeScript</h1>
      <p className="subtitle">Vite 开发服务器已就绪，后端 FastAPI 通过 /api 代理访问。</p>
      <button type="button" onClick={() => setCount((c) => c + 1)}>
        count is {count}
      </button>
    </>
  )
}
