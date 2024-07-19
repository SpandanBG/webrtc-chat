import { useRef, useState, useEffect, useCallback } from 'react'

const ws_addr = "ws://localhost:8080";

export interface SSInfo {
  conn: WebSocket
  uuid: string
  msg: string
  send: (msg: string) => void
  add: (uuid: string) => void
  join: (uuid: string) => void
}

export function useSignlingServer(): SSInfo {
  const ws_conn = useRef<WebSocket>(new WebSocket(ws_addr))
  const uuid = useRef<string>("")
  const [msg, setMsg] = useState<string>("")

  const send = useCallback((msg: string) => {
    ws_conn.current?.send(`write ${msg}`)
  }, [ws_conn.current])

  const add = useCallback((uuid: string) => {
    ws_conn.current?.send(`add ${uuid}`)
  }, [ws_conn.current])

  const join = useCallback((uuid: string) => {
    ws_conn.current?.send(`join ${uuid}`)
  }, [ws_conn.current])

  useEffect(() => {
    if (!ws_conn.current) return;

    ws_conn.current.addEventListener("message", ({ data }) => {
      if (!uuid.current) {
        uuid.current = data
        ws_conn.current.send(`banner Welcome to ${uuid}`)
      }
      setMsg(data)
    });

  }, [ws_conn.current])

  return { conn: ws_conn.current, uuid: uuid.current, msg, send, add, join }
}
