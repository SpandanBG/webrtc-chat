import { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { useSignlingServer } from './hooks/use-signaling-server'
import { Welcome } from './Welcome';
import { Chat } from './Chat'

enum UIState {
  WELCOME,
  CHAT
}

interface UUIDProps {
  uuid: string;
}

function UUID({ uuid }: UUIDProps) {
  const [showCopied, setShowCopied] = useState<boolean>(false)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>()

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(uuid)
    setShowCopied(true)

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => setShowCopied(false), 1500)
  }, [uuid])

  useEffect(() => () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <div style={{ marginBottom: "25px" }}>
      <span onClick={copyToClipboard}>{uuid}</span>
      {showCopied ? <span>&nbsp;Copied!!</span> : undefined}
    </div>
  )
}

function App() {
  const [msg, setMsg] = useState<string>("")

  const ssInfo = useSignlingServer(setMsg);
  const [uiState, setUIState] = useState<UIState>(UIState.WELCOME)
  const [peerUUID, setPeerUUID] = useState<string>("")

  const setWelcomeUI = useCallback(() => setUIState(UIState.WELCOME), [])
  const setChatUI = useCallback((uuid: string) => {
    setPeerUUID(uuid)
    setUIState(UIState.CHAT)
  }, [])

  const ui = useMemo(() => {
    switch (uiState) {
      case UIState.WELCOME:
        return <Welcome setChatUI={setChatUI} ssInfo={ssInfo} />
      case UIState.CHAT:
        return <Chat setWelcomeUI={setWelcomeUI} ssInfo={ssInfo} peerUUID={peerUUID} msg={msg} />
      default:
        return <></>
    }
  }, [uiState])

  return (
    <>
      <UUID uuid={ssInfo.uuid} />
      {ui}
    </>
  );
}

export default App;
