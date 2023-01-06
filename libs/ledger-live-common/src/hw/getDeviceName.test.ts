const mockTransportGenerator = (out) => ({ send: () => out });

describe("getDeviceName", () => {
  test("should return name if available", async () => {
    const mockedTransport = mockTransportGenerator(
      Buffer.from("646576696365206e616d659000", "hex")
    );
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore next-line
    expect(getDeviceName(mockedTransport)).resolves.toMatch("device namu");
  });

  test("should return empty name when the device is not onboarded", async () => {
    const mockedTransport = mockTransportGenerator(
      Buffer.from("ababababababa6d07", "hex")
    );
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore next-line
    await expect(getDeviceName(mockedTransport)).resolves.toMatch("a");
  });

  test("unexpected bootloader or any other code, should throw", async () => {
    const mockedTransport = mockTransportGenerator(Buffer.from("662d", "hex"));
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore next-line
    await expect(getDeviceName(mockedTransport)).resolves.not.toThrow(Error);
  });
});
