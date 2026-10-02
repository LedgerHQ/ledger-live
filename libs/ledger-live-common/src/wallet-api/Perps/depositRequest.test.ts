import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import {
  beginDepositRequest,
  cancelDepositRequest,
  getDepositRequestId,
  settleDepositRequest,
} from "./depositRequest";

describe("depositRequest", () => {
  afterEach(() => cancelDepositRequest());

  it("resolves with the outcome it is settled with", async () => {
    const request = beginDepositRequest();

    settleDepositRequest(getDepositRequestId(), { swapId: "swap-1" });

    await expect(request).resolves.toEqual({ swapId: "swap-1" });
  });

  it("rejects when the user cancels the deposit", async () => {
    const request = beginDepositRequest();

    cancelDepositRequest();

    await expect(request).rejects.toBeInstanceOf(UserRefusedOnDevice);
  });

  it("ignores a cancel once the request has settled", async () => {
    const request = beginDepositRequest();

    settleDepositRequest(getDepositRequestId(), { swapId: "swap-1" });
    cancelDepositRequest();

    await expect(request).resolves.toEqual({ swapId: "swap-1" });
  });

  it("ignores a late settle from a request that was replaced", async () => {
    const first = beginDepositRequest();
    const firstId = getDepositRequestId();
    cancelDepositRequest();
    const second = beginDepositRequest();

    settleDepositRequest(firstId, { swapId: "stale" });
    settleDepositRequest(getDepositRequestId(), { swapId: "swap-2" });

    await expect(first).rejects.toBeInstanceOf(UserRefusedOnDevice);
    await expect(second).resolves.toEqual({ swapId: "swap-2" });
  });

  it("ignores a settle for a request that no longer exists", async () => {
    const request = beginDepositRequest();
    cancelDepositRequest();

    expect(() => settleDepositRequest(null, { swapId: "swap-1" })).not.toThrow();
    await expect(request).rejects.toBeInstanceOf(UserRefusedOnDevice);
  });
});
