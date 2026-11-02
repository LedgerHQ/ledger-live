import { PERPS_UI_USE_CASE } from "@ledgerhq/live-common/wallet-api/ModularDrawer/uiUseCase";
import { getPerpsDrawerHeading } from "../getPerpsDrawerHeading";

describe("getPerpsDrawerHeading", () => {
  it.each([
    [
      PERPS_UI_USE_CASE.fund,
      {
        titleKey: "modularDrawer.selectDepositCurrencyTitle",
        descriptionKey: "modularDrawer.selectDepositCurrencyDescription",
      },
    ],
    [
      PERPS_UI_USE_CASE.withdraw,
      {
        titleKey: "modularDrawer.selectWithdrawCurrencyTitle",
        descriptionKey: "modularDrawer.selectWithdrawCurrencyDescription",
      },
    ],
  ])("returns the asset step copy for %s", (uiUseCase, heading) => {
    expect(getPerpsDrawerHeading("asset", uiUseCase, true)).toEqual(heading);
  });

  it.each([
    [PERPS_UI_USE_CASE.receive, true, "modularDrawer.selectAccountPerpsDescription"],
    [PERPS_UI_USE_CASE.receive, false, "modularDrawer.selectAccountPerpsEmptyDescription"],
    [
      PERPS_UI_USE_CASE.withdrawFrom,
      true,
      "modularDrawer.selectAccountPerpsWithdrawFromDescription",
    ],
    [
      PERPS_UI_USE_CASE.withdrawFrom,
      false,
      "modularDrawer.selectAccountPerpsWithdrawFromEmptyDescription",
    ],
  ])("returns the account step copy for %s (has accounts: %s)", (uiUseCase, hasAccounts, key) => {
    expect(getPerpsDrawerHeading("account", uiUseCase, hasAccounts)).toEqual({
      titleKey: "modularDrawer.selectAccountPerpsTitle",
      descriptionKey: key,
    });
  });

  it("returns nothing for a step the use case does not customise", () => {
    expect(getPerpsDrawerHeading("account", PERPS_UI_USE_CASE.withdraw, true)).toBeUndefined();
  });

  it("returns nothing outside perps", () => {
    expect(getPerpsDrawerHeading("asset", "pay", true)).toBeUndefined();
    expect(getPerpsDrawerHeading("asset", undefined, true)).toBeUndefined();
  });
});
