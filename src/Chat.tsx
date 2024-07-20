import { useCallback, useRef } from "react";
import { useRTC } from "./hooks/use-rtc";
import type { SSInfo } from "./hooks/use-signaling-server";

export interface ChatProps {
  ssInfo: SSInfo;
  peerUUID: string;
  setWelcomeUI: () => void;
}

export function Chat({ peerUUID, ssInfo }: ChatProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const {
    channelMsg,
    createOffer,
    sendMsg,
    rtcReady,
    sendVideoFeed,
    stopVideoFeed,
    sendAudioFeed,
    stopAudioFeed,
  } = useRTC(ssInfo);

  const joinPeer = useCallback(() => {
    createOffer(peerUUID);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerUUID]);

  const sendMsgViaSS = useCallback(() => {
    if (inputRef.current)
      ssInfo.send(
        inputRef.current.value,
        peerUUID || ssInfo.peers[ssInfo.peers.length - 1]
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputRef.current]);

  const sendMsgViaRTC = useCallback(() => {
    if (inputRef.current) sendMsg(inputRef.current.value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputRef.current]);

  return (
    <>
      ss-msg &gt; {ssInfo.msg}
      <br />
      <br />
      rtc-msg &gt; {channelMsg}
      <br />
      <br />
      {peerUUID && (
        <button type="button" onClick={joinPeer}>
          CALL: {peerUUID}
        </button>
      )}
      <br />
      <input ref={inputRef} type="text" placeholder="<msg>" />
      <button type="button" onClick={sendMsgViaSS}>
        Send via SS
      </button>
      <button type="button" onClick={sendMsgViaRTC} disabled={!rtcReady}>
        Send via RTC
      </button>
      <button type="button" onClick={sendVideoFeed}>
        Send via Video
      </button>
      <button type="button" onClick={stopVideoFeed}>
        Stop Video
      </button>
      <button type="button" onClick={sendAudioFeed}>
        Join Audio
      </button>
      <button type="button" onClick={stopAudioFeed}>
        Stop Audio
      </button>
      <video id="remoteVideo" autoPlay>
        {" "}
        Remote Video
      </video>
      <video id="localVideo" autoPlay>
        {" "}
        Local Video
      </video>
      <audio id="audioContainer"></audio>
      <audio id="remoteAudio"></audio>
      <br />
    </>
  );
}
