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
  const family = secondary ? "MuseoSans" : "OpenSans";
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
