import { getSteps, getTokenAction } from "./Body";
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
