import { useCallback, useEffect, useRef, useState } from 'react'
import type { SSInfo } from './use-signaling-server';
import {
  offerPacket,
  answerPacket,
  iceCandidatePacket,
  unpackPacket,
  PacketType,
} from '../lib/packet'

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
      username: 'admin',
      credential: 'pass',
    },
  ]
}

const dataChannelName = "channel-123"
const dataChannelOptions: RTCDataChannelInit = {}

interface PeerContext {
  sentIceCandidate: boolean;
}

interface PeersManager {
  peerContexts: Record<string, PeerContext>;
  sendIceToFreshPeer: (iceCandiates: RTCIceCandidate) => void;
}

function useManagedPeers(ssInfo: SSInfo): PeersManager {
  const [peerCtx, setPeerCtx] = useState<Record<string, PeerContext>>({})

  // Add new peer to ctx if present
  useEffect(() => {
    ssInfo.peers?.forEach(peer => {
      if (peer in peerCtx) return;
      setPeerCtx(prevCtx => ({ ...prevCtx, [peer]: { sentIceCandidate: false } }))
    })
  }, [ssInfo.peers.length])

  const sendIceToFreshPeer = useCallback((iceCandidate: RTCIceCandidate) => {
    Object.keys(peerCtx).forEach(peerUUID => {
      if (peerCtx[peerUUID].sentIceCandidate) return;
      ssInfo.send(iceCandidatePacket(iceCandidate, ssInfo.uuid), peerUUID)
      peerCtx[peerUUID].sentIceCandidate = true;
    })
  }, [peerCtx])

  return { peerContexts: peerCtx, sendIceToFreshPeer }
}

interface RTCInfo {
  channelMsg: string;
  createOffer: (uuid: string) => void;
  sendMsg: (msg: string) => void;
  rtcReady: boolean;
}

export function useRTC(ssInfo: SSInfo): RTCInfo {
  const peerConn = useRef<RTCPeerConnection>(new RTCPeerConnection(peerConfig))
  const dataChannel = useRef<RTCDataChannel | undefined>()
  const [channelMsg, setChannelMsg] = useState<string>("")
  const [rtcReady, setRtcReady] = useState<boolean>(false)
  const [iceCandidate, setIceCandidate] = useState<RTCIceCandidate | undefined>();
  const { peerContexts, sendIceToFreshPeer } = useManagedPeers(ssInfo);

  useEffect(() => {
    if (!iceCandidate || !peerContexts) return;
    sendIceToFreshPeer(iceCandidate);
  }, [peerContexts, iceCandidate])

  // Prepare data channel and send ice candidate
  useEffect(() => {
    dataChannel.current = peerConn.current.createDataChannel(
      dataChannelName,
      dataChannelOptions,
    )

    dataChannel.current.onmessage = ({ data }) => {
      setChannelMsg(data)
    }

    dataChannel.current.onopen = () => {
      setRtcReady(true)
    }

    peerConn.current.onicecandidate = ({ candidate }) => {
      if (candidate) setIceCandidate(candidate)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerConn.current])

  const createOffer = useCallback(() => {
    peerConn.current.createOffer()
      .then((offer) => {
        const data = offerPacket(offer, ssInfo.uuid)
        ssInfo.publish(data);

        peerConn.current.setLocalDescription(offer)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerConn.current])

  const handleIncomingOffer = useCallback((offer: RTCSessionDescriptionInit) => {
    peerConn.current.setRemoteDescription(new RTCSessionDescription(offer))
    peerConn.current.createAnswer()
      .then((answer) => {
        const data = answerPacket(answer, ssInfo.uuid)
        ssInfo.publish(data)

        peerConn.current.setLocalDescription(answer)
      })

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerConn.current])

  const handleIncomingAnswer = useCallback((answer: RTCSessionDescriptionInit) => {
    peerConn.current.setRemoteDescription(new RTCSessionDescription(answer))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerConn.current])

  const handleIncomingIceCandidate = useCallback((iceCandidate: RTCIceCandidate) => {
    peerConn.current.addIceCandidate(new RTCIceCandidate(iceCandidate))
    setIceCandidate(iceCandidate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerConn.current])

  // Handle messages from signaling server
  useEffect(() => {
    const [packet, isValid] = unpackPacket(ssInfo.msg)

    if (!isValid) return;

    switch (packet.type) {
      case PacketType.OFFER:
        handleIncomingOffer(packet.data as unknown as RTCSessionDescriptionInit)
        break;
      case PacketType.ANSWER:
        handleIncomingAnswer(packet.data as unknown as RTCSessionDescriptionInit)
        break;
      case PacketType.ICE_CANDIDATE:
        handleIncomingIceCandidate(packet.data as unknown as RTCIceCandidate)
        break;
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ssInfo.msg])

  const sendMsg = useCallback((msg: string) => {
    if (dataChannel.current && dataChannel.current.readyState) {
      dataChannel.current.send(msg)
    }
  }, [dataChannel.current])

  return {
    channelMsg,
    createOffer,
    sendMsg,
    rtcReady,
  }
}
