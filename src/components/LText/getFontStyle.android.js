/* @flow */
import type { Opts, Res } from "."; // eslint-disable-line

export default ({
  bold,
  semiBold,
  secondary,
  tertiary,
  monospace,
}: Opts = {}): Res => {
  const family = secondary
    ? "MuseoSans"
    : tertiary
      ? "Rubik"
      : monospace
        ? "monospace"
        : "OpenSans";
  let weight;
  if (semiBold) {
    weight = "SemiBold";
  } else if (bold) {
    weight = "Bold";
  } else {
    weight = "Regular";
  }

  const fontFamily = monospace ? family : `${family}-${weight}`;
  return { fontFamily, fontWeight: "normal" };
};
