import React from "react";
import styled from "styled-components";
import NanoS from "./NanoS";
import NanoX from "./NanoX";
import Blue from "./Blue";
export type ScreenTypes =
  | "validation"
  | "home"
  | "pin"
  | "empty"
  | "bootloaderMode"
  | "bootloader"
  | "recovery"
  | "update";
export type Props = {
  type: "nanoS" | "nanoX" | "blue";
  wire?: "wired" | "disconnecting" | "connecting";
  action?: "left" | "accept";
  screen?: ScreenTypes;
  width?: number;
  error?: Error | null;
};
export const Wrapper = styled.div`
  position: relative;
`;
const usbMap = {
  wired: "plugged",
  disconnecting: "unplugHint",
  connecting: "plugHint",
};
const devices = {
  blue: Blue,
  nanoX: NanoX,
  nanoS: NanoS,
};
const Interactions = ({ type = "nanoS", wire, screen, error, action, width }: Props) => {
  const Device = devices[type] || NanoS;
  const props = {
    error: !!error,
    screen: error ? "fail" : screen,
    usb: wire && (usbMap[wire] as React.ComponentProps<typeof Device>["usb"]),
    leftHint: action === "left" || (type === "nanoX" && action === "accept"),
    rightHint: action === "accept",
    width,
  };
  return <Device open {...props} />;
};
export default Interactions;
