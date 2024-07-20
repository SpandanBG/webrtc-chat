import { useCallback, useEffect, useRef, useState } from "react";
import type { SSInfo } from "./use-signaling-server";
import {
  offerPacket,
  answerPacket,
  iceCandidatePacket,
  unpackPacket,
  PacketType,
} from "../lib/packet";

const peerConfig: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stunserver.org" },
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    { urls: "stun:stun01.sipphone.com" },
    { urls: "stun:stun.ekiga.net" },
    { urls: "stun:stun.fwdnet.net" },
    { urls: "stun:stun.ideasip.com" },
    { urls: "stun:stun.iptel.org" },
    { urls: "stun:stun.rixtelecom.se" },
    { urls: "stun:stun.schlund.de" },
    { urls: "stun:stunserver.org" },
    { urls: "stun:stun.softjoys.com" },
    { urls: "stun:stun.voiparound.com" },
    { urls: "stun:stun.voipbuster.com" },
    { urls: "stun:stun.voipstunt.com" },
    { urls: "stun:stun.voxgratia.org" },
    { urls: "stun:stun.xten.com" },
    {
      urls: "turn:localhost:3478",
      username: "asdf",
      credential: "asdf",
    },
  ],
};

const dataChannelName = "channel-123";
const dataChannelOptions: RTCDataChannelInit = {};

interface PeerContext {
  sentIceCandidate: boolean;
}

interface PeersManager {
  peerContexts: Record<string, PeerContext>;
  sendIceToFreshPeer: (iceCandiates: RTCIceCandidate) => void;
}
function hasUserMedia() {
  //check if the browser supports the WebRTC
  return !!navigator.mediaDevices.getUserMedia;
}

function useManagedPeers(ssInfo: SSInfo): PeersManager {
  const [peerCtx, setPeerCtx] = useState<Record<string, PeerContext>>({});

  // Add new peer to ctx if present
  useEffect(() => {
    ssInfo.peers?.forEach((peer) => {
      if (peer in peerCtx) return;
      setPeerCtx((prevCtx) => ({
        ...prevCtx,
        [peer]: { sentIceCandidate: false },
      }));
    });
  }, [ssInfo.peers.length]);

  const sendIceToFreshPeer = useCallback(
    (iceCandidate: RTCIceCandidate) => {
      Object.keys(peerCtx).forEach((peerUUID) => {
        if (peerCtx[peerUUID].sentIceCandidate) return;
        ssInfo.send(iceCandidatePacket(iceCandidate, ssInfo.uuid), peerUUID);
        peerCtx[peerUUID].sentIceCandidate = true;
      });
    },
    [peerCtx]
  );

  return { peerContexts: peerCtx, sendIceToFreshPeer };
}

interface RTCInfo {
  channelMsg: string;
  createOffer: (uuid: string) => void;
  sendMsg: (msg: string) => void;
  rtcReady: boolean;
  sendVideoFeed: () => void;
  stopVideoFeed: () => void;
  sendAudioFeed: () => void;
  stopAudioFeed: () => void;
}

export function useRTC(ssInfo: SSInfo): RTCInfo {
  const peerConn = useRef<RTCPeerConnection>(new RTCPeerConnection(peerConfig));
  const dataChannel = useRef<RTCDataChannel | undefined>();
  const [channelMsg, setChannelMsg] = useState<string>("");
  const [rtcReady, setRtcReady] = useState<boolean>(false);
  const [iceCandidate, setIceCandidate] = useState<
    RTCIceCandidate | undefined
  >();
  const { peerContexts, sendIceToFreshPeer } = useManagedPeers(ssInfo);

  useEffect(() => {
    if (!iceCandidate || !peerContexts) return;
    sendIceToFreshPeer(iceCandidate);
  }, [peerContexts, iceCandidate]);

  // Prepare data channel and send ice candidate
  useEffect(() => {
    console.log("peer current", peerConn.current);
    dataChannel.current = peerConn.current.createDataChannel(
      dataChannelName,
      dataChannelOptions
    );

    dataChannel.current.onopen = () => {
      console.log("reached onopen");
      setRtcReady(true);
    };

    peerConn.current.onicecandidate = ({ candidate }) => {
      if (candidate) setIceCandidate(candidate);
    };

    peerConn.current.ondatachannel = (event) => {
      const dataChannel = event.channel;
      console.log("data channel changed", event);
      dataChannel.onmessage = ({ data }) => setChannelMsg(data);
    };

    // Used to renegotiate the connection to ensure that the remote peer receives the new track.
    peerConn.current.onnegotiationneeded = async () => {
      try {
        const offer = await peerConn.current.createOffer();
        await peerConn.current.setLocalDescription(offer);
        const data = offerPacket(offer, ssInfo.uuid);
        ssInfo.publish(data);
      } catch (error) {
        console.error("Error during negotiation", error);
      }
    };

    peerConn.current.ontrack = (event) => {
      if (event.track.kind === "video") {
        const remoteVideo = document.getElementById(
          "remoteVideo"
        ) as HTMLVideoElement;
        if (remoteVideo) {
          remoteVideo.srcObject = event.streams[0];
          remoteVideo.play();
        }
      } else if (event.track.kind === "audio") {
        const remoteAudio = document.getElementById(
          "remoteAudio"
        ) as HTMLAudioElement;
        if (remoteAudio) {
          remoteAudio.srcObject = event.streams[0];
          remoteAudio.play();
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerConn.current]);

  const createOffer = useCallback(() => {
    peerConn.current.createOffer().then((offer) => {
      const data = offerPacket(offer, ssInfo.uuid);
      ssInfo.publish(data);

      peerConn.current.setLocalDescription(offer);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerConn.current]);

  const handleIncomingOffer = useCallback(
    (offer: RTCSessionDescriptionInit) => {
      peerConn.current.setRemoteDescription(new RTCSessionDescription(offer));
      peerConn.current.createAnswer().then((answer) => {
        const data = answerPacket(answer, ssInfo.uuid);
        ssInfo.publish(data);

        peerConn.current.setLocalDescription(answer);
      });

      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [peerConn.current]
  );

  const handleIncomingAnswer = useCallback(
    (answer: RTCSessionDescriptionInit) => {
      peerConn.current.setRemoteDescription(new RTCSessionDescription(answer));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [peerConn.current]
  );

  const handleIncomingIceCandidate = useCallback(
    (iceCandidate: RTCIceCandidate) => {
      peerConn.current.addIceCandidate(iceCandidate);
      setIceCandidate(iceCandidate);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [peerConn.current]
  );

  // Handle messages from signaling server
  useEffect(() => {
    const [packet, isValid] = unpackPacket(ssInfo.msg);

    if (!isValid) return;

    switch (packet.type) {
      case PacketType.OFFER:
        handleIncomingOffer(
          packet.data as unknown as RTCSessionDescriptionInit
        );
        break;
      case PacketType.ANSWER:
        handleIncomingAnswer(
          packet.data as unknown as RTCSessionDescriptionInit
        );
        break;
      case PacketType.ICE_CANDIDATE:
        handleIncomingIceCandidate(packet.data as unknown as RTCIceCandidate);
        break;
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ssInfo.msg]);

  const sendMsg = useCallback(
    (msg: string) => {
      console.log("reached mssg 1");
      if (dataChannel.current && dataChannel.current.readyState == "open") {
        console.log("reached mssg 2");
        dataChannel.current.send(msg);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dataChannel.current]
  );

  const sendVideoFeed = useCallback(() => {
    if (hasUserMedia()) {
      navigator.mediaDevices
        .getUserMedia({
          video: {
            facingMode: "user", // or "environment" for rear camera
          },
        })
        .then((stream) => {
          const video = document.getElementById(
            "localVideo"
          ) as HTMLVideoElement;
          if (video) {
            video.srcObject = stream;
            video.play();
          }
          stream.getTracks().forEach((track) => {
            console.log("show tracks", track);
            try {
              peerConn.current.addTrack(track, stream);
            } catch {
              console.log("error adding track");
            }
            debugger;
          });
        })
        .catch((error) => {
          console.error("Error accessing media devices.", error);
        });
    } else {
      console.error("User media not available");
    }
  }, [peerConn.current]);

  const stopVideoFeed = useCallback(() => {
    const video = document.getElementById("localVideo") as HTMLVideoElement;
    if (video && video.srcObject) {
      const stream = video.srcObject as MediaStream;
      const tracks = stream.getTracks();

      tracks.forEach((track) => {
        track.stop();
      });

      const senders = peerConn.current.getSenders();
      senders.forEach((sender) => {
        peerConn.current.removeTrack(sender);
      });

      video.srcObject = null;
    }
  }, []);

  const sendAudioFeed = useCallback(() => {
    if (hasUserMedia()) {
      navigator.mediaDevices
        .getUserMedia({
          audio: true,
        })
        .then((stream) => {
          const audio = document.getElementById(
            "audioContainer"
          ) as HTMLAudioElement;
          audio.srcObject = stream;
          audio.play();
          stream.getTracks().forEach((track) => {
            console.log("show audio tracks", track);
            try {
              peerConn.current.addTrack(track, stream);
            } catch {
              console.log("error adding audio track");
            }
          });
        })
        .catch((error) => {
          console.error("Error accessing audio media devices.", error);
        });
    } else {
      console.error("User media not available for audio");
    }
  }, [peerConn.current]);

  const stopAudioFeed = useCallback(() => {
    // Assuming there's an audio element to hold the stream
    const audio = document.getElementById("audioContainer") as HTMLAudioElement;

    if (audio && audio.srcObject) {
      const stream = audio.srcObject as MediaStream;
      const tracks = stream.getTracks();
      console.log("audio track stop");
      tracks.forEach((track) => {
        console.log("audio stop track");
        track.stop();
      });

      const senders = peerConn.current.getSenders();
      senders.forEach((sender) => {
        if (sender.track?.kind === "audio") {
          peerConn.current.removeTrack(sender);
        }
      });

      audio.srcObject = null;
    }
  }, []);

  return {
    channelMsg,
    createOffer,
    sendMsg,
    rtcReady,
    sendVideoFeed,
    stopVideoFeed,
    sendAudioFeed,
    stopAudioFeed,
  };
}
