export enum PacketType {
  OFFER = 1,
  ANSWER = 2,
  ICE_CANDIDATE = 3,
  NONE = 4,
};

interface Packet {
  type: PacketType;
  data: RTCSessionDescriptionInit | RTCIceCandidateInit | string;
}

export function offerPacket(offer: RTCSessionDescriptionInit): string {
  const pkt: Packet = {
    type: PacketType.OFFER,
    data: offer
  }

  return JSON.stringify(pkt)
}

export function answerPacket(answer: RTCSessionDescriptionInit): string {
  const pkt: Packet = {
    type: PacketType.ANSWER,
    data: answer
  }

  return JSON.stringify(pkt)
}

export function iceCandidatePacket(candidate: RTCIceCandidateInit): string {
  const pkt: Packet = {
    type: PacketType.ICE_CANDIDATE,
    data: candidate
  }

  return JSON.stringify(pkt)
}

export function unpackPacket(packetStr: string): [Packet, boolean] {
  try {
    return [JSON.parse(packetStr) as unknown as Packet, true];
  } catch {
    return [{ type: PacketType.NONE, data: packetStr }, false];
  }
}
