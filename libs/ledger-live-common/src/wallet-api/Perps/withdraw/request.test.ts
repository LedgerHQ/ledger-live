import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import {
  beginWithdrawRequest,
  cancelWithdrawRequest,
  getWithdrawRequestId,
  markWithdrawRequestCommitted,
  rejectWithdrawRequest,
  settleWithdrawRequest,
} from "./request";
import { beginDepositRequest, cancelDepositRequest } from "../deposit/request";

describe("withdrawRequest", () => {
  afterEach(() => {
    cancelWithdrawRequest();
    cancelDepositRequest();
  });

  it("resolves with the withdrawal outcome", async () => {
    const request = beginWithdrawRequest();

    settleWithdrawRequest(getWithdrawRequestId(), { swapId: "swap-1", amountTo: "0.3" });

    await expect(request).resolves.toEqual({ swapId: "swap-1", amountTo: "0.3" });
  });

  it("rejects with a user refusal when the user leaves before submitting", async () => {
    const request = beginWithdrawRequest();

    cancelWithdrawRequest();

    await expect(request).rejects.toBeInstanceOf(UserRefusedOnDevice);
  });

  it("never reports a refusal once the withdrawal is submitted", async () => {
    const request = beginWithdrawRequest();
    const id = getWithdrawRequestId();

    markWithdrawRequestCommitted(id);
    cancelWithdrawRequest();
    settleWithdrawRequest(id, { swapId: "swap-1" });

    await expect(request).resolves.toEqual({ swapId: "swap-1" });
  });

  it("forwards a submission failure once submitted, not a refusal", async () => {
    const request = beginWithdrawRequest();
    const id = getWithdrawRequestId();
    const failure = new Error("submit failed");

    markWithdrawRequestCommitted(id);
    rejectWithdrawRequest(id, failure);

    await expect(request).rejects.toBe(failure);
    expect(getWithdrawRequestId()).toBeNull();
  });

  it("is independent from the deposit request", async () => {
    const deposit = beginDepositRequest();
    const withdraw = beginWithdrawRequest();

    cancelDepositRequest();
    settleWithdrawRequest(getWithdrawRequestId(), { swapId: "swap-1" });

    await expect(deposit).rejects.toBeInstanceOf(UserRefusedOnDevice);
    await expect(withdraw).resolves.toEqual({ swapId: "swap-1" });
  });
});
