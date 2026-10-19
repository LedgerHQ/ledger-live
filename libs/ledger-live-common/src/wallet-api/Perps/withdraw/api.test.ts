import { AxiosHeaders } from "axios";
import network from "@ledgerhq/live-network/network";
import { NetworkDown } from "@ledgerhq/live-network/errors";
import { getEnv } from "@ledgerhq/live-env";
import { submitWithdraw } from "./api";
import { WithdrawApiError, WithdrawSubmitUnknownOutcomeError } from "./errors";
import {
  errorBody,
  mayanPayloadResponse,
  nearPayloadResponse,
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

    it("sends the NEAR hyperCoreAction back unmodified with the signature", async () => {
      respond(200, submitResponse);

      await submitWithdraw({ payload: nearPayloadResponse, signature });

      expect(mockedNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "POST",
          url: `${BASE_URL}/swapkit_hyperliquid/submit`,
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
});
