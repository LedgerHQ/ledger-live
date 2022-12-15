import staxFetchImageHash from "./staxFetchImageHash";

const mockTransportGenerator = (out) => ({ send: () => out });
describe("staxFetchImageHash", () => {
  test("should return hash if available", async () => {
    const mockedTransport = mockTransportGenerator(
      Buffer.from(
        "32ee3de100f2bca886aaeeaa31f25e043fab61279cd4d4c123e73d5ce02f3a759000",
        "hex"
      )
    );
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore next-line
    const response = await staxFetchImageHash(mockedTransport);
    expect(response).toMatch(
      "32ee3de100f2bca886aaeeaa31f25e043fab61279cd4d4c123e73d5ce02f3a75"
    );
  });

  test("should return empty hash even with the error status code", async () => {
    const mockedTransport = mockTransportGenerator(Buffer.from("662e", "hex"));
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore next-line
    await expect(staxFetchImageHash(mockedTransport)).resolves.toMatch("");
  });

  test("unexpected bootloader or any other code, should throw", async () => {
    const mockedTransport = mockTransportGenerator(Buffer.from("662d", "hex"));
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore next-line
    await expect(staxFetchImageHash(mockedTransport)).rejects.toThrow(Error);
  });
});
