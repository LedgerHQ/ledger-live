import Color from "color";

export const rgba = (c: string, a: number): string =>
  Color(c).alpha(a).rgb().toString();

export const hex = (color: string): string => Color(color).hex().toString();

export const darken = (c: string, a: number) => Color(c).darken(a).toString();

export const lighten = (c: string, a: number): string =>
  Color(c).lighten(a).toString();

export const mix = (c: string, b: string, a: number): string =>
  Color(c).mix(Color(b), a).toString();

const get = (object: Record<string, any>, path: string | string[]): unknown => {
  let p: string | string[] = path;
  if (typeof path === "string") p = path.split(".").filter((key) => key.length);
  // @ts-expect-error FIXME
  return p.reduce(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    (dive: Record<string, any>, key: string) => dive && dive[key],
    object
  );
};

export const getColor = (p: Record<string, any>, color: string): string => {
  const c = get(p.colors, color) as string;
  return c;
};
