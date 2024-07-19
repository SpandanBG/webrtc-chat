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
    { urls: "stun:stun.xten.com" },
  ]
}

const dataChannelName = "channel-123"
const dataChannelOptions: RTCDataChannelInit = {}

interface RTCInfo {
  createOffer: (uuid: string) => void
}

export function useRTC(ssInfo: SSInfo, msg: string): RTCInfo {
  const peerConn = useRef<RTCPeerConnection>(new RTCPeerConnection(peerConfig))
  const dataChannel = useRef<RTCDataChannel | undefined>()

  // Prepare data channel and send ice candidate
  useEffect(() => {
    dataChannel.current = peerConn.current.createDataChannel(
      dataChannelName,
      dataChannelOptions,
    )

    peerConn.current.onicecandidate = ({ candidate }) => {
      if (candidate) ssInfo.send(iceCandidatePacket(candidate, ssInfo.uuid))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerConn.current])

  const createOffer = useCallback(() => {
    peerConn.current.createOffer()
      .then((offer) => {
        const data = offerPacket(offer, ssInfo.uuid)
        ssInfo.send(data);

        peerConn.current.setLocalDescription(offer)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerConn.current])

  const handleIncomingOffer = useCallback((offer: RTCSessionDescriptionInit) => {
    peerConn.current.setRemoteDescription(new RTCSessionDescription(offer))
    peerConn.current.createAnswer()
      .then((answer) => {
        const data = answerPacket(answer, ssInfo.uuid)
        ssInfo.send(data)

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerConn.current])

  // Handle messages from signaling server
  useEffect(() => {
    const [packet, isValid] = unpackPacket(msg)

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
  }, [msg])

  return {
    createOffer,
  }
}
