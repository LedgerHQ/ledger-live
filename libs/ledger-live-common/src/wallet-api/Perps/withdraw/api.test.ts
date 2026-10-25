import { AxiosHeaders } from "axios";
import network from "@ledgerhq/live-network/network";
import { NetworkDown } from "@ledgerhq/live-network/errors";
import { getEnv } from "@ledgerhq/live-env";
import { submitWithdraw } from "./api";
import { WithdrawPayloadSchema } from "./schemas";
import {
  WithdrawApiError,
  WithdrawLowLiquidityError,
  WithdrawSubmitUnknownOutcomeError,
} from "./errors";
import {
  errorBody,
  mayanWithdrawPayload,
  nearWithdrawPayload,
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

describe("SwapKit withdraw API", () => {
  beforeEach(() => jest.resetAllMocks());

  describe("submitWithdraw", () => {
    const signature = "0xsignature";

    const nearPayload = WithdrawPayloadSchema.parse(nearWithdrawPayload);
    const mayanPayload = WithdrawPayloadSchema.parse(mayanWithdrawPayload);

    it("submits the NEAR swap id, hyperCoreAction and signature", async () => {
      respond(200, submitResponse);

      await submitWithdraw({ payload: nearPayload, signature });

      expect(mockedNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "POST",
          url: `${BASE_URL}/swapkit_hyperliquid/submit`,
          data: {
            swapId: nearWithdrawPayload.swapId,
            hyperCoreAction: nearWithdrawPayload.hyperCoreAction,
            signature,
          },
        }),
      );
    });

    it("submits the Mayan swap id, typedData and signature", async () => {
      respond(200, submitResponse);

      await submitWithdraw({ payload: mayanPayload, signature });

      expect(mockedNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            swapId: mayanWithdrawPayload.swapId,
            typedData: mayanWithdrawPayload.typedData,
            signature,
          },
        }),
      );
    });

    it("returns the swapId to track", async () => {
      respond(200, submitResponse);

      await expect(submitWithdraw({ payload: mayanPayload, signature })).resolves.toEqual({
        swapId: "swap-mayan-1",
      });
    });

    it("never retries a failed submit, and reports a definite failure as such", async () => {
      respond(400, errorBody("SOMETHING_ELSE"));

      const error = await submitWithdraw({ payload: mayanPayload, signature }).catch(
        (e: unknown) => e,
      );

      expect(error).toBeInstanceOf(WithdrawApiError);
      expect(error).not.toBeInstanceOf(WithdrawSubmitUnknownOutcomeError);
      expect(mockedNetwork).toHaveBeenCalledTimes(1);
    });

    it.each([
      ["a 502 with an HTML body", 502, "<html>Bad gateway</html>"],
      ["a 504 with an empty body", 504, ""],
      ["a 503 with an HTML body", 503, "<html>Service unavailable</html>"],
      ["an unrecognized 500", 500, errorBody("SOMETHING_ELSE")],
    ])("reports an unknown outcome on %s", async (_, status, body) => {
      respond(status, body);

      await expect(submitWithdraw({ payload: mayanPayload, signature })).rejects.toBeInstanceOf(
        WithdrawSubmitUnknownOutcomeError,
      );
    });

    it("reports an unknown outcome when the request times out without a response", async () => {
      mockedNetwork.mockRejectedValueOnce(
        Object.assign(new Error("timeout of 10000ms exceeded"), { code: "ECONNABORTED" }),
      );

      await expect(submitWithdraw({ payload: mayanPayload, signature })).rejects.toBeInstanceOf(
        WithdrawSubmitUnknownOutcomeError,
      );
    });

    it("reports an unknown outcome when the success body cannot be read", async () => {
      respond(200, { unexpected: true });

      await expect(submitWithdraw({ payload: mayanPayload, signature })).rejects.toBeInstanceOf(
        WithdrawSubmitUnknownOutcomeError,
      );
    });

    it("reports a known rejection code as definite even on a 5xx", async () => {
      respond(500, errorBody("SWAP_QUOTE_LOW_LIQUIDITY"));

      const error = await submitWithdraw({ payload: mayanPayload, signature }).catch(
        (e: unknown) => e,
      );

      expect(error).toBeInstanceOf(WithdrawLowLiquidityError);
      expect(error).not.toBeInstanceOf(WithdrawSubmitUnknownOutcomeError);
    });

    it("reports an unknown outcome on 502 SUBMIT_FAILED_ERROR", async () => {
      respond(502, errorBody("SUBMIT_FAILED_ERROR"));

      await expect(submitWithdraw({ payload: mayanPayload, signature })).rejects.toBeInstanceOf(
        WithdrawSubmitUnknownOutcomeError,
      );
    });

    it("reports an unknown outcome when the network drops, since the request may have landed", async () => {
      mockedNetwork.mockRejectedValueOnce(new NetworkDown());

      await expect(submitWithdraw({ payload: mayanPayload, signature })).rejects.toBeInstanceOf(
        WithdrawSubmitUnknownOutcomeError,
      );
    });
  });
});
