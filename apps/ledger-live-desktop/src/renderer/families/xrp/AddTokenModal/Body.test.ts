import { BigNumber } from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getSteps, makeChangeTrustTransaction } from "./Body";
import type { AddTokenStep } from "./types";

const iou = { tokenType: "iou" } as TokenCurrency;
const mpt = { tokenType: "mpt" } as TokenCurrency;

const account = {
  type: "Account",
  id: "js:2:ripple_testnet:rHolder:",
  derivationMode: "",
  currency: getCryptoCurrencyById("ripple_testnet"),
} as Account;

const rlusdAccount = {
  type: "TokenAccount",
  id: "js:2:ripple_testnet:rHolder:+rlusd",
  token: { tokenType: "iou", tokenIdentifier: "RLUSD", contractAddress: "rIssuer" },
  xrpResources: { limit: new BigNumber(500) },
} as unknown as TokenAccount;

const toIds = (steps: AddTokenStep[]) => steps.map(step => step.id);

describe("getSteps", () => {
  it("asks an IOU for its settings between the token and the review", () => {
    expect(toIds(getSteps("add", iou))).toEqual([
      "token",
      "settings",
      "review",
      "connectDevice",
      "confirmation",
    ]);
  });

  it("skips the settings for an MPT", () => {
    expect(toIds(getSteps("add", mpt))).toEqual([
      "token",
      "review",
      "connectDevice",
      "confirmation",
    ]);
  });

  it("starts an edit at the settings, with no way back to the token", () => {
    const steps = getSteps("edit", iou);

    expect(toIds(steps)).toEqual(["settings", "review", "connectDevice", "confirmation"]);
    expect(steps[0].onBack).toBeUndefined();
  });

  it("goes back from the review to the step before it", () => {
    const transitionTo = jest.fn();
    const reviewStep = getSteps("add", mpt).find(step => step.id === "review");

    reviewStep?.onBack?.({ token: mpt, transitionTo } as never);
    reviewStep?.onBack?.({ token: iou, transitionTo } as never);

    expect(transitionTo.mock.calls).toEqual([["token"], ["settings"]]);
  });
});

describe("makeChangeTrustTransaction", () => {
  it("edits a held token's limit on the parent account, without subAccountId", async () => {
    const bridge = await getAccountBridge(account);

    const transaction = makeChangeTrustTransaction(bridge, account, rlusdAccount);

    expect(transaction).not.toHaveProperty("subAccountId");
    expect(transaction).toMatchObject({
      mode: "changeTrust",
      assetReference: "RLUSD",
      assetOwner: "rIssuer",
      amount: new BigNumber(500),
    });
  });

  it("starts an add with no token picked and no subAccountId", async () => {
    const bridge = await getAccountBridge(account);

    const transaction = makeChangeTrustTransaction(bridge, account, undefined);

    expect(transaction).not.toHaveProperty("subAccountId");
    expect(transaction).not.toHaveProperty("assetReference");
    expect(transaction.mode).toBe("changeTrust");
  });
});
