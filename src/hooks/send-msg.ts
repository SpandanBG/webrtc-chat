import { useRef, useState, useEffect, useCallback } from "react";

export interface watchPartyProps {
  type: any;
  data: any;
}

export enum watchPartyActionTypes {
  MSG = "MSG",
  PAUSE = "PAUSE",
  PLAY = "PLAY",
  SEEK = "SEEK",
}

export function watchPartyAction({ type, data }: watchPartyProps) {
  switch (type) {
    case watchPartyActionTypes.MSG:
      write(data);
      break;
    case watchPartyActionTypes.PAUSE:
      write(data);
      break;
    case watchPartyActionTypes.PLAY:
      write(data);
  }
  return null;
}

function write(data: any) {
  throw new Error("Function not implemented.");
}
