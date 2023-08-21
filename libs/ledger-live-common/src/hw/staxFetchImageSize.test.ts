import staxFetchImageSize from "./staxFetchImageSize";

const mockTransportGenerator = out => ({ send: () => out });
describe("staxFetchImageSize", () => {
  test("should return size if available", async () => {
    const mockedTransport = mockTransportGenerator(Buffer.from("000089e99000", "hex"));
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore next-line
    const response = await staxFetchImageSize(mockedTransport);
    expect(response).toBe(35305);
  });

  test("should return 0 when no size is returned", async () => {
    const mockedTransport = mockTransportGenerator(Buffer.from("000000009000", "hex"));
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore next-line
    await expect(staxFetchImageSize(mockedTransport)).resolves.toBe(0);
  });

  test("unexpected bootloader or any other code, should throw", async () => {
    const mockedTransport = mockTransportGenerator(Buffer.from("662d", "hex"));
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore next-line
    await expect(staxFetchImageSize(mockedTransport)).rejects.toThrow(Error);
  });

  /*
   * The infinite loop firmware was released before the custom lockscreen feature was
   * developed, leaving us with a device that can be updated inifinetely but doesn't
   * respond well to these apdus. Since accessing the manager with a stax device will
   * automatically trigger this command, we need to handle it, at the very least for
   * our engineers.
   */
  test("il fw for nano doesn't support the CLS apdus, should still pass with 0", async () => {
    const mockedTransport = mockTransportGenerator(Buffer.from("662e", "hex"));
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore next-line
    await expect(staxFetchImageSize(mockedTransport)).resolves.toBe(0);
  });
});
