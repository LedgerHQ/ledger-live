/* @flow */
import type { Opts, Res } from "./";

export default ({ bold, semiBold, secondary, tertiary }: Opts = {}): Res => {
  const family = secondary ? "MuseoSans" : tertiary ? "Rubik" : "OpenSans";
  let weight;
  if (semiBold) {
    weight = "SemiBold";
  } else if (bold) {
    weight = "Bold";
  } else {
    weight = "Regular";
  }
  return { fontFamily: `${family}-${weight}`, fontWeight: "normal" };
};
