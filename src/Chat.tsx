import { useRTC } from './hooks/use-rtc';
import type { SSInfo } from './hooks/use-signaling-server'

export interface ChatProps {
  ssInfo: SSInfo;
  setWelcomeUI: () => void;
}

export function Chat({ setWelcomeUI, ssInfo }: ChatProps) {
  useRTC(ssInfo)

  return <>chat</>
}
