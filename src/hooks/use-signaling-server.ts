import { useRef, useState, useEffect, useCallback } from 'react'

const ws_addr = "ws://localhost:8080";

export interface SSInfo {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws_conn.current])

  const add = useCallback((uuid: string) => {
    ws_conn.current?.send(`add ${uuid}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws_conn.current])

  const join = useCallback((uuid: string) => {
    ws_conn.current?.send(`join ${uuid}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws_conn.current])

  useEffect(() => {
    if (!ws_conn.current) return

    ws_conn.current.onmessage = (({ data }) => {
      if (!uuid.current) {
        uuid.current = data
      }
      setMsg(data)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { uuid: uuid.current, msg: msg, send, add, join }
}
