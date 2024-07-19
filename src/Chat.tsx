import { useCallback, useRef } from 'react';
import { useRTC } from './hooks/use-rtc';
import type { SSInfo } from './hooks/use-signaling-server'

export interface ChatProps {
  ssInfo: SSInfo;
  peerUUID: string;
  setWelcomeUI: () => void;
}

export function Chat({ peerUUID, ssInfo }: ChatProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const { channelMsg, createOffer, sendMsg } = useRTC(ssInfo);

  const joinPeer = useCallback(() => {
    createOffer(peerUUID)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerUUID])

  const sendMsgViaSS = useCallback(() => {
    if (inputRef.current) ssInfo.send(inputRef.current.value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputRef.current])

  const sendMsgViaRTC = useCallback(() => {
    if (inputRef.current) sendMsg(inputRef.current.value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputRef.current])


  return (
    <>
      ss-msg &gt; {ssInfo.msg}<br />
      <br />
      rtc-msg &gt; {channelMsg}<br />
      <br />
      {peerUUID && <button type="button" onClick={joinPeer}>CALL: {peerUUID}</button>}
      <br />
      <input ref={inputRef} type="text" placeholder="<msg>" />
      <button type="button" onClick={sendMsgViaSS}>Send via SS</button>
      <button type="button" onClick={sendMsgViaRTC}>Send via RTC</button>
      <br />
    </>
  )
}
