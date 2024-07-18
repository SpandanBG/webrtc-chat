import { useRef, useState, useEffect } from 'react'

const ws_addr = "ws://localhost:8080";

interface SSInfo {
  conn: WebSocket
  uuid: string
  msg: string
}

export function useSignlingServer(): SSInfo {
  const ws_conn = useRef<WebSocket>(new WebSocket(ws_addr))
  const uuid = useRef<string>("")
  const [msg, setMsg] = useState<string>("")

  useEffect(() => {
    if (!ws_conn.current) return;

    ws_conn.current.addEventListener("message", ({ data }) => {
      if (!uuid.current) {
        uuid.current = data
      }
      setMsg(data)
    });

  }, [ws_conn.current])

  return { conn: ws_conn.current, uuid: uuid.current, msg }
}
