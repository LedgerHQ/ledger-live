/* @flow */
type Opts = {
  bold?: boolean,
  semiBold?: boolean,
  secondary?: boolean,
};
type Res = {
  fontFamily: string,
  fontWeight: string,
};

export default ({ bold, semiBold, secondary }: Opts = {}): Res => {
  const fontFamily = secondary ? "Museo Sans" : "Open Sans";
  let fontWeight = secondary ? -200 : 0; // Fix for Museo weights being off by 200;
  if (semiBold) {
    fontWeight += 600;
  } else if (bold) {
    fontWeight += 700;
  } else {
    fontWeight += 400;
  }
  return { fontFamily, fontWeight: fontWeight.toString() };
};
