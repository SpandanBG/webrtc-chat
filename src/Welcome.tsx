import { useCallback, useRef } from 'react';
import type { SSInfo } from './hooks/use-signaling-server'

export interface WelcomeProps {
  ssInfo: SSInfo;
  setChatUI: () => void;
}

export function Welcome({ setChatUI, ssInfo }: WelcomeProps) {
  const { add, join } = ssInfo;

  const inputRef = useRef<HTMLInputElement | null>(null);

  const joinGrp = useCallback(() => {
    if (!inputRef.current) return;
    add(inputRef.current.value)
    join(inputRef.current.value)
    setChatUI();
  }, [add, join])

  return (
    <>
      <button type="button" onClick={setChatUI}>Host</button>
      <br />
      <input ref={inputRef} type="text" placeholder="uuid" />
      <button type="button" onClick={joinGrp}>Join</button>
    </>
  )
}

