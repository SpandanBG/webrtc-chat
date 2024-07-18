import { useSignlingServer } from './hooks/use-signaling-server'

function App() {
  const { msg } = useSignlingServer();

  return (
    <> &lt; {msg}</>
  );
}

export default App;
