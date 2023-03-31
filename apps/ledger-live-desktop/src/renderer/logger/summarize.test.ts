import { summarize } from "./summarize";
describe("circular reference protection", () => {
  test("object circular reference", () => {
    const obj: any = {
      foo: 42,
    };
    obj.a = obj;
    expect(summarize(obj)).toEqual({
      foo: 42,
      a: undefined,
    });
  });
  test("array circular reference", () => {
    const obj: any = {
      foo: 42,
      a: [],
    };
    obj.a.push(obj);
    expect(summarize(obj)).toEqual({
      foo: 42,
      a: [undefined],
    });
  });
  test("inner object circular reference", () => {
    const obj: any = {
      foo: 42,
      a: {},
    };
    obj.a.a = obj;
    expect(summarize(obj)).toEqual({
      foo: 42,
      a: {
        a: undefined,
      },
    });
  });
});
