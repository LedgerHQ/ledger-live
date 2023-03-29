import Color from "color";

export const rgba = (c: string, a: number): string => Color(c).alpha(a).rgb().toString();

export const hex = (color: string): string => Color(color).hex().toString();

export const getAlpha = (color: string): number => Color(color).alpha();

export const darken = (c: string, a: number) => Color(c).darken(a).toString();

export const lighten = (c: string, a: number): string => Color(c).lighten(a).toString();

export const mix = (c: string, b: string, a: number): string =>
  Color(c).mix(Color(b), a).toString();

const get = (object: unknown, path: string | string[]): unknown => {
  const p: string[] = typeof path === "string" ? path.split(".").filter((key) => key.length) : path;
  return p.reduce(
    (dive: unknown, key: string) => dive && (dive as { [key: string]: unknown })[key],
    object,
  );
};
export const getColor = (p: { colors: unknown }, color: string): string => {
  const c = get(p.colors, color) as string;
  return c;
};

export const ensureContrast = (color1: string, color2: string) => {
  const colorL1 = Color(color1).luminosity() + 0.05;
  const colorL2 = Color(color2).luminosity() + 0.05;

  const lRatio = colorL1 > colorL2 ? colorL1 / colorL2 : colorL2 / colorL1;

  if (lRatio < 1.5) {
    return Color(color1).rotate(180).negate().string();
  }
  return color1;
};
