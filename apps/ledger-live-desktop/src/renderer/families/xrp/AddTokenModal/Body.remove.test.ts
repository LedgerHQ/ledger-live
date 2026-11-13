import { getAction, getSteps } from "./Body";
import { XRP_ACCOUNT, XRP_IOU_TOKEN_ACCOUNT } from "../__mocks__/account.mock";
import { xrpIouToken } from "../__mocks__/currency.mock";

describe("xrp remove token steps", () => {
  it("removes a token only when the token account comes with remove", () => {
    const tokenAccount = XRP_IOU_TOKEN_ACCOUNT;

    expect(getAction({ account: XRP_ACCOUNT, tokenAccount, remove: true })).toBe("remove");
    expect(getAction({ account: XRP_ACCOUNT, tokenAccount })).toBe("edit");
    expect(getAction({ account: XRP_ACCOUNT, remove: true })).toBe("add");
  });

  it("goes review, device, confirmation, with no way back from review", () => {
    const steps = getSteps("remove", xrpIouToken);

    expect(steps.map(step => step.id)).toEqual(["review", "connectDevice", "confirmation"]);
    expect(steps[0].onBack).toBeUndefined();
  });
});
