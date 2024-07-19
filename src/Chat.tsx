import { useCallback } from 'react';
import { useRTC } from './hooks/use-rtc';
import type { SSInfo } from './hooks/use-signaling-server'

export interface ChatProps {
  ssInfo: SSInfo;
  peerUUID: string;
  setWelcomeUI: () => void;
}

export function Chat({ peerUUID, ssInfo }: ChatProps) {
  const { createOffer } = useRTC(ssInfo);

  const joinPeer = useCallback(() => {
    createOffer(peerUUID)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerUUID])

  return (
    <>
      msg &gt; {ssInfo.msg}<br />
      <button type="button" onClick={joinPeer}>CALL: {peerUUID}</button>
    </>
  )
}
