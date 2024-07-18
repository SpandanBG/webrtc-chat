import { useEffect, useRef } from 'react'
import type { SSInfo } from './use-signaling-server';

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

interface RTCInfo { }

export function useRTC(ssInfo: SSInfo): RTCInfo {
  const peerConn = useRef<RTCPeerConnection>(new RTCPeerConnection(peerConfig))
  const dataChannel = useRef<RTCDataChannel | undefined>()

  useEffect(() => {
    dataChannel.current = peerConn.current.createDataChannel(dataChannelName, dataChannelOptions)

    peerConn.current.onicecandidate = ({ candidate }) => {
      console.log(JSON.stringify(candidate))
      ssInfo.send(JSON.stringify(candidate))
    }
  }, [peerConn.current])

  useEffect(() => {

    console.log("state>", peerConn.current.iceConnectionState)

  }, [peerConn.current.iceConnectionState])

  // Handle messages from signaling server
  useEffect(() => {

  }, [ssInfo.msg])

  return {}
}
