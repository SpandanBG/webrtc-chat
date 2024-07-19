import { useRef, useEffect, useCallback } from 'react'
import type { Dispatch, SetStateAction } from 'react'

const ws_addr = "ws://localhost:8080";

export interface SSInfo {
  uuid: string
  send: (msg: string) => void
  add: (uuid: string) => void
  join: (uuid: string) => void
}

type SetMsgT = Dispatch<SetStateAction<string>>

export function useSignlingServer(setMsg: SetMsgT): SSInfo {
  const ws_conn = useRef<WebSocket | undefined>()
  const uuid = useRef<string>("")

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
    const conn = new WebSocket(ws_addr)
    ws_conn.current = conn;

    conn.onmessage = (({ data }) => {
      if (!uuid.current) {
        uuid.current = data
      }
      setMsg(data)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { uuid: uuid.current, send, add, join }
}
