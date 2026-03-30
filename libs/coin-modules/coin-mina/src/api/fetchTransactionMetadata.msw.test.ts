import { makePreprocessResponse, makeMetadataResponse } from "../test/helpers/msw-fixtures";
import { server, rosettaHandlers } from "../test/helpers/msw-rosetta.mock";
import { fetchTransactionMetadata } from "./index";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const SRC_ADDRESS = "B62qjWLs1W3J2fFGixeX49w1o7VvSGuMBNotnFhzs3PZ7PbtdFbhdeD";
const DST_ADDRESS = "B62qkWcHhoisWDCR7v3gvWzX6wXEVuGYLHXq3mSym4GEzfYXmSDv314";

describe("fetchTransactionMetadata via MSW", () => {
  it("should fetch preprocess then metadata and return suggested fees", async () => {
    server.use(
      ...rosettaHandlers({
        "/construction/preprocess": () => makePreprocessResponse(SRC_ADDRESS, DST_ADDRESS),
        "/construction/metadata": () =>
          makeMetadataResponse({
            nonce: "10",
            feeValue: "10000000",
            minimumFee: "1000000",
            sender: SRC_ADDRESS,
            receiver: DST_ADDRESS,
          }),
      }),
    );

    const metadata = await fetchTransactionMetadata(SRC_ADDRESS, DST_ADDRESS, 10000000, 10000000);

    expect(metadata.suggested_fee).toHaveLength(1);
    expect(metadata.suggested_fee[0].value).toBe("10000000");
    expect(metadata.metadata.nonce).toBe("10");
    expect(metadata.metadata.sender).toBe(SRC_ADDRESS);
    expect(metadata.metadata.receiver).toBe(DST_ADDRESS);
  });

  it("should include account_creation_fee when present", async () => {
    server.use(
      ...rosettaHandlers({
        "/construction/preprocess": () => makePreprocessResponse(SRC_ADDRESS, DST_ADDRESS),
        "/construction/metadata": () =>
          makeMetadataResponse({
            accountCreationFee: "1000000000",
          }),
      }),
    );

    const metadata = await fetchTransactionMetadata(SRC_ADDRESS, DST_ADDRESS, 10000000, 10000000);

    expect(metadata.metadata.account_creation_fee).toBe("1000000000");
  });

  it("should use delegation payload for staking transactions", async () => {
    server.use(
      ...rosettaHandlers({
        "/construction/preprocess": () => makePreprocessResponse(SRC_ADDRESS, DST_ADDRESS),
        "/construction/metadata": () =>
          makeMetadataResponse({
            nonce: "5",
            feeValue: "10000000",
            sender: SRC_ADDRESS,
            receiver: DST_ADDRESS,
          }),
      }),
    );

    const metadata = await fetchTransactionMetadata(
      SRC_ADDRESS,
      DST_ADDRESS,
      10000000,
      0,
      "delegation",
    );

    expect(metadata.suggested_fee[0].value).toBe("10000000");
    expect(metadata.metadata.nonce).toBe("5");
  });

  it("should propagate error when preprocess fails", async () => {
    server.use(
      ...rosettaHandlers({
        "/construction/preprocess": () => {
          throw new Error("Preprocess failed");
        },
      }),
    );

    await expect(
      fetchTransactionMetadata(SRC_ADDRESS, DST_ADDRESS, 10000000, 10000000),
    ).rejects.toThrow();
  });
});
