import BigNumber from "bignumber.js";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import {
  getSteps,
  getTokenAction,
  makeChangeTrustTransaction,
  makeOptOutTransaction,
} from "./Body";
import type { AddTokenStep } from "./types";
import { XRP_ACCOUNT, XRP_IOU_TOKEN_ACCOUNT, makeXrpTokenAccount } from "../__mocks__/account.mock";
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

  it("starts a removal at the review, with no way back", () => {
    const steps = getSteps("remove", iou);

    expect(toIds(steps)).toEqual(["review", "connectDevice", "confirmation"]);
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

describe("getTokenAction", () => {
  it("adds without a token account, edits or removes with one", () => {
    expect(getTokenAction({ account })).toBe("add");
    expect(getTokenAction({ account, tokenAccount: rlusdAccount })).toBe("edit");
    expect(getTokenAction({ account, tokenAccount: rlusdAccount, remove: true })).toBe("remove");
  });
});

describe("makeOptOutTransaction", () => {
  it("opts out of a held token on the parent account, with no amount", async () => {
    const bridge = await getAccountBridge(account);

    const transaction = makeOptOutTransaction(bridge, account, rlusdAccount);

    expect(transaction).not.toHaveProperty("subAccountId");
    expect(transaction).toMatchObject({
      mode: "optOut",
      assetReference: xrpIouToken.tokenIdentifier,
      assetOwner: xrpIouToken.contractAddress,
      amount: new BigNumber(0),
    });
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
    expect(transaction).not.toHaveProperty("noRipple");
    expect(transaction.mode).toBe("changeTrust");
  });

  it.each([
    [true, false],
    [false, true],
    [undefined, true],
  ])("resends isRippling %s on an edit as noRipple %s", async (isRippling, noRipple) => {
    const bridge = await getAccountBridge(account);
    const limit = new BigNumber(1000).shiftedBy(38);
    const tokenAccount = makeXrpTokenAccount({ limit, isRippling });

    const transaction = makeChangeTrustTransaction(bridge, account, tokenAccount);

    expect(transaction).toMatchObject({ noRipple, mode: "changeTrust", amount: limit });
  });
});
