import type { SSInfo } from './hooks/use-signaling-server'

export interface WelcomeProps {
  ssInfo: SSInfo;
  setChatUI: () => void;
}

export function Welcome({ setChatUI }: WelcomeProps) {
  return <>Welcome</>
}

