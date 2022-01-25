import Color from "color";

export const rgba = (c: string, a: number): string => Color(c).alpha(a).rgb().toString();

export const hex = (color: string): string => Color(color).hex().toString();

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
