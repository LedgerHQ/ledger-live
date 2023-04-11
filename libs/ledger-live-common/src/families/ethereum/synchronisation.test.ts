import { API } from "../../api/Ethereum";
import { fetchAllTransactions } from "./synchronisation";

describe("fetchAllTransactions", () => {
  const apiMock = {
    getTransactions: jest.fn(),
  } as unknown as API;

  const sampleAddress = "toto";

  const sampleBlockHeight = 42;

  let getTransactionsSpy: jest.SpyInstance;

  beforeEach(() => {
    getTransactionsSpy = jest.spyOn(apiMock, "getTransactions");
  });

  afterEach(() => {
    getTransactionsSpy.mockReset();
  });

  it("should keep calling getTransactions until token is null", async () => {
    getTransactionsSpy.mockReturnValueOnce(
      Promise.resolve({ txs: [], nextPageToken: "token1" })
    );
    getTransactionsSpy.mockReturnValueOnce(
      Promise.resolve({ txs: [], nextPageToken: "token2" })
    );
    getTransactionsSpy.mockReturnValueOnce(
      Promise.resolve({ txs: [], nextPageToken: null })
    );
    await fetchAllTransactions(apiMock, sampleAddress, sampleBlockHeight);
    expect(getTransactionsSpy).toHaveBeenCalledTimes(3);
  });

  it("should call getTransactions once if token is null", async () => {
    getTransactionsSpy.mockReturnValueOnce(
      Promise.resolve({ txs: [], nextPageToken: null })
    );
    await fetchAllTransactions(apiMock, sampleAddress, sampleBlockHeight);
    expect(getTransactionsSpy).toHaveBeenCalledTimes(1);
  });

  it("should accumulate txs between calls", async () => {
    getTransactionsSpy.mockReturnValueOnce(
      Promise.resolve({
        txs: [{ hash: "1" }, { hash: "2" }],
        nextPageToken: "token1",
      })
    );
    getTransactionsSpy.mockReturnValueOnce(
      Promise.resolve({ txs: [{ hash: "3" }], nextPageToken: null })
    );
    const txs = await fetchAllTransactions(
      apiMock,
      sampleAddress,
      sampleBlockHeight
    );
    expect(txs.length).toEqual(3);
  });
});
