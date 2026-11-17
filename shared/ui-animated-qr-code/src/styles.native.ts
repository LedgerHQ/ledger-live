import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";

// The ink is a fixed dark: Lumen's white stays white in both themes, so the code stays readable on
// a dark screen.
export const paperStyle: LumenViewStyle = {
  backgroundColor: "white",
};

export const centerStyle: LumenViewStyle = {
  position: "absolute",
};

const fillStyle: LumenViewStyle = {
  position: "absolute",
  top: "s0",
  right: "s0",
  bottom: "s0",
  left: "s0",
};

export const placeholderStyle: LumenViewStyle = {
  ...fillStyle,
  borderRadius: "full",
};

export const contentStyle: LumenViewStyle = {
  ...fillStyle,
  alignItems: "center",
  justifyContent: "center",
};
