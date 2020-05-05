/* @flow */
import invariant from "invariant";
import type { Opts, Res } from ".";

export default ({
  bold,
  semiBold,
  secondary,
  tertiary,
  monospace,
}: Opts = {}): Res => {
  if (__DEV__) {
    invariant(
      !((semiBold || bold) && tertiary),
      "There is no case where Rubik is semibold/bold in this design",
    );
  }
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
