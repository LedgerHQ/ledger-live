import expect from "expect";
export default (a: unknown, b: unknown, msg: string): void => {
  try {
    // using expect for a nice diff log
    expect(a).toEqual(b);
  } catch (e: any) {
    console.warn(msg + " " + e.message);
  }
};
