import { useCallback, useRef } from 'react';
import type { SSInfo } from './hooks/use-signaling-server'

export interface WelcomeProps {
  ssInfo: SSInfo;
  setChatUI: (uuid: string) => void;
}

export function Welcome({ setChatUI, ssInfo }: WelcomeProps) {
  const { add, join } = ssInfo;

  const inputRef = useRef<HTMLInputElement | null>(null);

  const joinGrp = useCallback(() => {
    if (!inputRef.current) return;

    add(inputRef.current.value)
    join(inputRef.current.value)
    setChatUI(inputRef.current.value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [add, join])

  const hostGrp = useCallback(() => [
    setChatUI("")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [])

  return (
    <>
      <button type="button" onClick={hostGrp}>Host</button>
      <br />
      <input ref={inputRef} type="text" placeholder="uuid" />
      <button type="button" onClick={joinGrp}>Join</button>
    </>
  )
}

