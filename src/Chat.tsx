import { useCallback, useRef } from 'react';
import { useRTC } from './hooks/use-rtc';
import type { SSInfo } from './hooks/use-signaling-server'

export interface ChatProps {
  ssInfo: SSInfo;
  peerUUID: string;
  msg: string;
  setWelcomeUI: () => void;
}

export function Chat({ msg, peerUUID, ssInfo }: ChatProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const { createOffer } = useRTC(ssInfo, msg);

  const joinPeer = useCallback(() => {
    createOffer(peerUUID)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerUUID])

  const sendMsg = useCallback(() => {
    if (inputRef.current) ssInfo.send(inputRef.current.value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputRef.current])

  return (
    <>
      msg &gt; {msg}<br />
      {peerUUID && <button type="button" onClick={joinPeer}>CALL: {peerUUID}</button>}
      <br />
      <input ref={inputRef} type="text" placeholder="msg ss peer" />
      <button type="button" onClick={sendMsg}>Send</button>
    </>
  )
}
