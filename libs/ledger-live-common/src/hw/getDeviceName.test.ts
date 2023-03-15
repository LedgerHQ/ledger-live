import getDeviceName from "./getDeviceName";

const mockTransportGenerator = (out) => ({ send: async () => out });

describe("getDeviceName", () => {
  test("should return name if available", async () => {
    const mockedTransport = mockTransportGenerator(
      Buffer.from("646576696365206e616d659000", "hex")
    );
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore next-line
    const res = await getDeviceName(mockedTransport);
    expect(res).toMatch("device name");
  });

  test("should return empty name when the device is not onboarded", async () => {
    const mockedTransport = mockTransportGenerator(
      Buffer.from("bababababababa6d07", "hex")
    );
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore next-line
    const res = await getDeviceName(mockedTransport);
    await expect(res).toMatch("");
  });

  test("should return empty name when the device is not onboarded #2", async () => {
    const mockedTransport = mockTransportGenerator(
      Buffer.from("bababababababa6611", "hex")
    );
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore next-line
    const res = await getDeviceName(mockedTransport);
    await expect(res).toMatch("");
  });

  test("unexpected bootloader or any other code, should throw", async () => {
    const mockedTransport = mockTransportGenerator(Buffer.from("662d", "hex"));
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore next-line
    await expect(getDeviceName(mockedTransport)).rejects.toThrow(Error);
  });
});
