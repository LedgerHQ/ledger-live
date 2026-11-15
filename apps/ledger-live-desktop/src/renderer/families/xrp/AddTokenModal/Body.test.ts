import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getSteps, makeChangeTrustTransaction } from "./Body";
import type { AddTokenStep } from "./types";
import { XRP_ACCOUNT, XRP_IOU_TOKEN_ACCOUNT } from "../__mocks__/account.mock";
import { xrpIouToken, xrpMptToken } from "../__mocks__/currency.mock";

const iou = xrpIouToken;
const mpt = xrpMptToken;
const account = XRP_ACCOUNT;
const rlusdAccount = XRP_IOU_TOKEN_ACCOUNT;

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
      assetReference: xrpIouToken.tokenIdentifier,
      assetOwner: xrpIouToken.contractAddress,
      amount: rlusdAccount.xrpResources?.limit,
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
