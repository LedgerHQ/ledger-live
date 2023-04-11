import { apiForCurrency, Tx } from "./Ethereum";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import URL from "url";
import { ParsedUrlQueryInput } from "node:querystring";

jest.mock(
  "../network",
  () => () =>
    Promise.resolve({
      data: {
        data: [{ hash: "sampleTxHash" } as Tx],
        token: "sampleBackendToken",
      },
    })
);

describe("apiForCurrency", () => {
  const addressMock = "";

  const currencyMock = {
    explorerId: "eth",
  } as CryptoCurrency;

  describe("getTransactions", () => {
    let urlFormatSpy: jest.SpyInstance;

    beforeEach(() => {
      urlFormatSpy = jest.spyOn(URL, "format");
    });

    it("should have a default batch size of 2000", async () => {
      await apiForCurrency(currencyMock).getTransactions(addressMock);
      const formatUrlInput: URL.UrlObject = urlFormatSpy.mock.lastCall[0];
      expect((formatUrlInput.query as ParsedUrlQueryInput).batch_size).toEqual(
        2000
      );
    });

    it("should have filtering query parameter to true", async () => {
      await apiForCurrency(currencyMock).getTransactions(addressMock);
      const formatUrlInput: URL.UrlObject = urlFormatSpy.mock.lastCall[0];
      expect((formatUrlInput.query as ParsedUrlQueryInput).filtering).toEqual(
        true
      );
    });

    describe("when batch_size is defined", () => {
      it("should use provided batch_size", async () => {
        const batchSizeMock = 42;
        await apiForCurrency(currencyMock).getTransactions(
          addressMock,
          undefined,
          batchSizeMock
        );
        const formatUrlInput: URL.UrlObject = urlFormatSpy.mock.lastCall[0];
        expect(
          (formatUrlInput.query as ParsedUrlQueryInput).batch_size
        ).toEqual(batchSizeMock);
      });
    });

    describe("when blockHeight is defined", () => {
      it("should use descending order", async () => {
        await apiForCurrency(currencyMock).getTransactions(addressMock, 9000);
        const formatUrlInput: URL.UrlObject = urlFormatSpy.mock.lastCall[0];
        expect((formatUrlInput.query as ParsedUrlQueryInput).order).toEqual(
          "descending"
        );
      });

      it("should use defined blockHeight for backend request", async () => {
        const blockHeightMock = 9000;
        await apiForCurrency(currencyMock).getTransactions(
          addressMock,
          blockHeightMock
        );
        const formatUrlInput: URL.UrlObject = urlFormatSpy.mock.lastCall[0];
        expect(
          (formatUrlInput.query as ParsedUrlQueryInput).from_height
        ).toEqual(blockHeightMock);
      });
    });

    describe("when token is defined", () => {
      it("should use defined token for backend request", async () => {
        const tokenMock = "i_am_a_token";
        await apiForCurrency(currencyMock).getTransactions(
          addressMock,
          undefined,
          undefined,
          tokenMock
        );
        const formatUrlInput: URL.UrlObject = urlFormatSpy.mock.lastCall[0];
        expect((formatUrlInput.query as ParsedUrlQueryInput).token).toEqual(
          tokenMock
        );
      });
    });

    it("should return backend txs in txs attribute", async () => {
      const result = await apiForCurrency(currencyMock).getTransactions(
        addressMock
      );
      expect(result.txs.length).toEqual(1);
      expect(result.txs[0].hash).toEqual("sampleTxHash");
    });

    it("should return backend token in nextPageToken attribute", async () => {
      const result = await apiForCurrency(currencyMock).getTransactions(
        addressMock
      );
      expect(result.nextPageToken).toEqual("sampleBackendToken");
    });
  });
});
