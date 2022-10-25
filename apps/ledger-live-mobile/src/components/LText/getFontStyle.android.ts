import type { Opts, Res } from ".";

export default ({ bold, semiBold, monospace }: Opts = {}): Res => {
  const family = monospace ? "monospace" : "Inter";
  let weight;

  if (semiBold) {
    weight = "SemiBold";
  } else if (bold) {
    weight = "Bold";
  } else {
    weight = "Regular";
  }

  const fontFamily = monospace ? family : `${family}-${weight}`;
  return {
    fontFamily,
    fontWeight: "normal",
  };
};
