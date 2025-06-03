import { getJSONStringifyReplacer } from "./index";

describe("getJSONStringifyReplacer", () => {
  it("should properly format Uint8Array values", () => {
    // given
    const replacer = getJSONStringifyReplacer();
    const testObj = { buffer: new Uint8Array([250, 250]) };
    const json = JSON.stringify(testObj, replacer);

    // when
    const parsed = JSON.parse(json);

    // then
    expect(parsed.buffer).toEqual({
      hex: "0xfafa",
      readableHex: "fa fa",
      value: "250,250",
    });
  });

  it("should replace circular references with '[Circular]'", () => {
    //given
    const replacer = getJSONStringifyReplacer();
    const circularObj: any = { name: "circularObj" };
    circularObj.self = circularObj;
    const json = JSON.stringify(circularObj, replacer);

    // when
    const parsed = JSON.parse(json);

    // then
    expect(parsed.self).toBe("[Circular]");
  });
});
