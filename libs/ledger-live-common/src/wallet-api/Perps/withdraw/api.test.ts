import { AxiosHeaders } from "axios";
import network from "@ledgerhq/live-network/network";
import { NetworkDown } from "@ledgerhq/live-network/errors";
import { getEnv } from "@ledgerhq/live-env";
import BigNumber from "bignumber.js";
import {
  fetchWithdrawCurrencies,
  fetchWithdrawPayload,
  fetchWithdrawQuote,
  fetchWithdrawStatus,
  submitWithdraw,
} from "./api";
import {
  WithdrawApiError,
  WithdrawLowLiquidityError,
  WithdrawSubmitUnknownOutcomeError,
} from "./errors";
import {
  currenciesResponse,
  errorBody,
  mayanPayloadResponse,
  nearPayloadResponse,
  quoteResponse,
  statusResponse,
  submitResponse,
} from "./__fixtures__/responses";

jest.mock("@ledgerhq/live-network/network");

const mockedNetwork = jest.mocked(network);
const BASE_URL = getEnv("SWAP_API_BASE");

const respond = (status: number, data: unknown) =>
  mockedNetwork.mockResolvedValueOnce({
    status,
    data,
    statusText: "",
    headers: {},
    config: { headers: new AxiosHeaders() },
  });

const quoteParams = {
  amount: new BigNumber("500"),
  sourceAddress: "0xsource",
  toCurrencyId: "ethereum",
  destinationAddress: "0xdestination",
};

describe("SwapKit withdraw API", () => {
  beforeEach(() => jest.resetAllMocks());

  describe("fetchWithdrawCurrencies", () => {
    it("GETs the supported currencies", async () => {
      respond(200, currenciesResponse);

      const result = await fetchWithdrawCurrencies();

      expect(result.currencies.map(c => c.id)).toEqual(["ethereum", "bitcoin", "solana"]);
      expect(mockedNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "GET",
          url: `${BASE_URL}/ledger/hyperliquid/currencies`,
        }),
      );
    });
  });

  describe("fetchWithdrawQuote", () => {
    it("POSTs the amount and destination and parses the quote", async () => {
      respond(200, quoteResponse);

      const quote = await fetchWithdrawQuote(quoteParams);

      expect(quote.amountTo).toEqual(new BigNumber("0.3"));
      expect(mockedNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "POST",
          url: `${BASE_URL}/withdraw/quote`,
          data: {
            amount: "500",
            sourceAddress: "0xsource",
            toCurrencyId: "ethereum",
            destinationAddress: "0xdestination",
          },
        }),
      );
    });

    it("throws the mapped error when the API rejects the quote", async () => {
      respond(400, errorBody("SWAP_QUOTE_LOW_LIQUIDITY"));

      await expect(fetchWithdrawQuote(quoteParams)).rejects.toBeInstanceOf(
        WithdrawLowLiquidityError,
      );
    });

    it("throws a generic API error when a 200 body does not match the schema", async () => {
      respond(200, { unexpected: true });

      await expect(fetchWithdrawQuote(quoteParams)).rejects.toBeInstanceOf(WithdrawApiError);
    });
  });

  describe("fetchWithdrawPayload", () => {
    it.each([
      ["Mayan", mayanPayloadResponse],
      ["NEAR", nearPayloadResponse],
    ])("returns the %s payload untouched", async (_, response) => {
      respond(200, response);

      const payload = await fetchWithdrawPayload({ ...quoteParams, quoteId: "quote-1" });

      expect(payload).toEqual(response);
      expect(mockedNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "POST",
          url: `${BASE_URL}/withdraw/payload`,
          data: expect.objectContaining({ quoteId: "quote-1" }),
        }),
      );
    });
  });

  describe("submitWithdraw", () => {
    const signature = "0xsignature";

    it("sends the NEAR hyperCoreAction back unmodified with the signature", async () => {
      respond(200, submitResponse);

      await submitWithdraw({ payload: nearPayloadResponse, signature });

      expect(mockedNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "POST",
          url: `${BASE_URL}/withdraw/submit`,
          data: { ...nearPayloadResponse, signature },
        }),
      );
    });

    it("returns the swapId to track", async () => {
      respond(200, submitResponse);

      await expect(submitWithdraw({ payload: mayanPayloadResponse, signature })).resolves.toEqual({
        swapId: "swap-mayan-1",
      });
    });

    it("never retries a failed submit, and reports a definite failure as such", async () => {
      respond(500, errorBody("SOMETHING_ELSE"));

      const error = await submitWithdraw({ payload: mayanPayloadResponse, signature }).catch(
        (e: unknown) => e,
      );

      expect(error).toBeInstanceOf(WithdrawApiError);
      expect(error).not.toBeInstanceOf(WithdrawSubmitUnknownOutcomeError);
      expect(mockedNetwork).toHaveBeenCalledTimes(1);
    });

    it.each([
      ["a 502 with an HTML body", 502, "<html>Bad gateway</html>"],
      ["a 504 with an empty body", 504, ""],
    ])("reports an unknown outcome on %s", async (_, status, body) => {
      respond(status, body);

      await expect(
        submitWithdraw({ payload: mayanPayloadResponse, signature }),
      ).rejects.toBeInstanceOf(WithdrawSubmitUnknownOutcomeError);
    });

    it("reports an unknown outcome when the request times out without a response", async () => {
      mockedNetwork.mockRejectedValueOnce(
        Object.assign(new Error("timeout of 10000ms exceeded"), { code: "ECONNABORTED" }),
      );

      await expect(
        submitWithdraw({ payload: mayanPayloadResponse, signature }),
      ).rejects.toBeInstanceOf(WithdrawSubmitUnknownOutcomeError);
    });

    it("reports an unknown outcome when the success body cannot be read", async () => {
      respond(200, { unexpected: true });

      await expect(
        submitWithdraw({ payload: mayanPayloadResponse, signature }),
      ).rejects.toBeInstanceOf(WithdrawSubmitUnknownOutcomeError);
    });

    it("reports an unknown outcome on 502 SUBMIT_FAILED_ERROR", async () => {
      respond(502, errorBody("SUBMIT_FAILED_ERROR"));

      await expect(
        submitWithdraw({ payload: mayanPayloadResponse, signature }),
      ).rejects.toBeInstanceOf(WithdrawSubmitUnknownOutcomeError);
    });

    it("reports an unknown outcome when the network drops, since the request may have landed", async () => {
      mockedNetwork.mockRejectedValueOnce(new NetworkDown());

      await expect(
        submitWithdraw({ payload: mayanPayloadResponse, signature }),
      ).rejects.toBeInstanceOf(WithdrawSubmitUnknownOutcomeError);
    });
  });

  describe("fetchWithdrawStatus", () => {
    it("GETs the status of a swap by id", async () => {
      respond(200, statusResponse);

      const status = await fetchWithdrawStatus("swap-mayan-1");

      expect(status.status).toBe("PENDING");
      expect(status.payoutNetworkFees).toEqual(new BigNumber("0.0004"));
      expect(mockedNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "GET",
          url: `${BASE_URL}/ledger/hyperliquid/status?swapId=swap-mayan-1`,
        }),
      );
    });
  });
});
