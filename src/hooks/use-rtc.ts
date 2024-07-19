import { useCallback, useEffect, useRef } from 'react'
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
    { urls: "stun:stun.xten.com" }
  ]
}

const dataChannelName = "channel-123"
const dataChannelOptions: RTCDataChannelInit = {}

interface RTCInfo {
  createOffer: (uuid: string) => void
}

export function useRTC(ssInfo: SSInfo): RTCInfo {
  const peerConn = useRef<RTCPeerConnection>(new RTCPeerConnection(peerConfig))
  const dataChannel = useRef<RTCDataChannel | undefined>()

  // Prepare data channel and send ice candidate
  useEffect(() => {
    dataChannel.current = peerConn.current.createDataChannel(
      dataChannelName,
      dataChannelOptions,
    )

    peerConn.current.onicecandidate = ({ candidate }) => {
      ssInfo.send(JSON.stringify(candidate))
    }
  }, [peerConn.current])

  const createOffer = useCallback(() => {
    peerConn.current.createOffer()
      .then((offer) => {
        const data = offerPacket(offer)
        ssInfo.send(data);

        peerConn.current.setLocalDescription(offer)
      })
  }, [peerConn.current])

  const handleIncomingOffer = useCallback((offer: RTCSessionDescriptionInit) => {
    peerConn.current.setRemoteDescription(new RTCSessionDescription(offer))
    peerConn.current.createAnswer()
      .then((answer) => {
        const data = answerPacket(answer)
        ssInfo.send(data)

        peerConn.current.setLocalDescription(answer)
      })

  }, [peerConn.current])

  const handleIncomingAnswer = useCallback((answer: RTCSessionDescriptionInit) => {
    peerConn.current.setRemoteDescription(new RTCSessionDescription(answer))
  }, [peerConn.current])

  const handleIncomingIceCandidate = useCallback((iceCandidate: RTCIceCandidateInit) => {
    peerConn.current.addIceCandidate(new RTCIceCandidate(iceCandidate))
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
        handleIncomingIceCandidate(packet.data as unknown as RTCIceCandidateInit)
        break;
    }

  }, [ssInfo.msg])

  return {
    createOffer,
  }
}
