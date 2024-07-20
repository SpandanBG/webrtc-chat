import { useRef, useState, useEffect, useCallback } from "react";

const ws_addr = "ws://localhost:8080";

export interface SSInfo {
  uuid: string;
  msg: string;
  peers: string[];
  publish: (msg: string) => void;
  send: (msg: string, uuid: string) => void;
  add: (uuid: string) => void;
  join: (uuid: string) => void;
}

export function useSignlingServer(): SSInfo {
  const ws_conn = useRef<WebSocket>(new WebSocket(ws_addr));
  const uuid = useRef<string>("");
  const [msg, setMsg] = useState<string>("");
  const [peers, addPeer] = useState<string[]>([]);

  const publish = useCallback(
    (msg: string) => {
      ws_conn.current?.send(`publish ${msg}`);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [ws_conn.current]
  );

  const send = useCallback(
    (msg: string, uuid: string) => {
      ws_conn.current?.send(`write ${uuid} ${msg}`);
    },
    [ws_conn.current]
  );

  const add = useCallback(
    (uuid: string) => {
      ws_conn.current?.send(`add ${uuid}`);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [ws_conn.current]
  );

  const join = useCallback(
    (uuid: string) => {
      ws_conn.current?.send(`join ${uuid}`);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [ws_conn.current]
  );

  useEffect(() => {
    if (!ws_conn.current) return;

    ws_conn.current.onmessage = ({ data }) => {
      if (!uuid.current) {
        uuid.current = data;
      }

      if (`${data}`.endsWith(" Joined")) {
        const [peerUUID] = `${data}`.split(" ");
        addPeer((prevPeer: string[]) => {
          prevPeer.push(peerUUID);
          return prevPeer;
        });
      }

      setMsg(data);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { uuid: uuid.current, msg: msg, peers, publish, send, add, join };
}
