// @flow
import expect from "expect";

export default (a: any, b: any, msg: string) => {
  try {
    // using expect for a nice diff log
    expect(a).toEqual(b);
  } catch (e) {
    console.warn(msg + " " + e.message);
  }
};
