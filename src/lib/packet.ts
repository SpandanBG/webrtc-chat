export enum PacketType {
  OFFER = 1,
  ANSWER = 2,
  ICE_CANDIDATE = 3,
  NONE = 4,
};

interface Packet {
  type: PacketType;
  sender_uuid: string;
  data: RTCSessionDescriptionInit | RTCIceCandidate | string;
}

export function offerPacket(offer: RTCSessionDescriptionInit, uuid: string): string {
  const pkt: Packet = {
    type: PacketType.OFFER,
    sender_uuid: uuid,
    data: offer
  }

  return JSON.stringify(pkt)
}

export function answerPacket(answer: RTCSessionDescriptionInit, uuid: string): string {
  const pkt: Packet = {
    type: PacketType.ANSWER,
    sender_uuid: uuid,
    data: answer
  }

  return JSON.stringify(pkt)
}

export function iceCandidatePacket(candidate: RTCIceCandidate, uuid: string): string {
  const pkt: Packet = {
    type: PacketType.ICE_CANDIDATE,
    sender_uuid: uuid,
    data: candidate
  }

  return JSON.stringify(pkt)
}

export function unpackPacket(packetStr: string): [Packet, boolean] {
  try {
    return [JSON.parse(packetStr) as unknown as Packet, true];
  } catch {
    return [{ type: PacketType.NONE, sender_uuid: "", data: packetStr }, false];
  }
}
