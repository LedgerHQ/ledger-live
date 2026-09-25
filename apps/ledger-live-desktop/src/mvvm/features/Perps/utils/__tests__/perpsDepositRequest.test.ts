import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import {
  beginDepositRequest,
  cancelDepositRequest,
  settleDepositRequest,
} from "../perpsDepositRequest";

describe("perpsDepositRequest", () => {
  afterEach(() => cancelDepositRequest());

  it("resolves with the outcome it is settled with", async () => {
    const request = beginDepositRequest();

    settleDepositRequest({ swapId: "swap-1" });

    await expect(request).resolves.toEqual({ swapId: "swap-1" });
  });

  it("rejects when the user cancels the deposit", async () => {
    const request = beginDepositRequest();

    cancelDepositRequest();

    await expect(request).rejects.toBeInstanceOf(UserRefusedOnDevice);
  });

  it("ignores a cancel once the request has settled", async () => {
    const request = beginDepositRequest();

    settleDepositRequest({ swapId: "swap-1" });
    cancelDepositRequest();

    await expect(request).resolves.toEqual({ swapId: "swap-1" });
  });
});
