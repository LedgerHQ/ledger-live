import { IconsLegacy } from "@ledgerhq/native-ui";
import accountActions from "../accountActions";
import { ALEO_ACCOUNT_1 } from "../__mocks__/account.mock";
import { aleoCurrency } from "../__mocks__/currency.mock";
import { NavigatorName, ScreenName } from "~/const";

jest.mock("@ledgerhq/native-ui", () => ({
  IconsLegacy: { TransferMedium: "TransferMedium" },
}));

jest.mock("~/context/Locale", () => ({
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
}));

describe("accountActions.getMainActions", () => {
  it("returns a single publicToPrivate action with correct shape", () => {
    const [action] = accountActions.getMainActions({ account: ALEO_ACCOUNT_1 });

    expect(action.id).toBe("public_to_private");
    expect((action.label as { props: { i18nKey: string } }).props.i18nKey).toBe(
      "aleo.accountActions.publicToPrivate",
    );
    expect(action.Icon).toBe(IconsLegacy.TransferMedium);
    expect(action.event).toBe("button_clicked");
    expect(action.eventProperties).toEqual({
      button: "public_to_private",
      currency: "ALEO",
      page: "Account Page",
    });
    expect(action.navigationParams).toEqual([
      NavigatorName.SendFunds,
      expect.objectContaining({
        screen: ScreenName.AleoSendBalanceSelection,
        params: expect.objectContaining({ isSelfTransfer: true }),
      }),
    ]);
  });
});

describe("accountActions.getExtraSendActionParams", () => {
  it("returns navigationParams pointing to AleoSendBalanceSelection with isSelfTransfer: false", () => {
    const result = accountActions.getExtraSendActionParams({ account: ALEO_ACCOUNT_1 });

    expect(result.navigationParams).toEqual([
      NavigatorName.SendFunds,
      expect.objectContaining({
        screen: ScreenName.AleoSendBalanceSelection,
        params: expect.objectContaining({ isSelfTransfer: false }),
      }),
    ]);
  });
});

describe("accountActions.getAdditionalAssetActions", () => {
  it("with defaultAccount — navigates to AleoSendBalanceSelection with isSelfTransfer: true", () => {
    const [action] = accountActions.getAdditionalAssetActions({
      currency: aleoCurrency,
      defaultAccount: ALEO_ACCOUNT_1,
      parentAccount: undefined,
    });

    expect(action.navigationParams).toEqual([
      NavigatorName.SendFunds,
      expect.objectContaining({
        screen: ScreenName.AleoSendBalanceSelection,
        params: expect.objectContaining({ isSelfTransfer: true }),
      }),
    ]);
  });

  it("without defaultAccount — navigates to SendCoin with extra.isSelfTransfer: true", () => {
    const [action] = accountActions.getAdditionalAssetActions({
      currency: aleoCurrency,
      defaultAccount: undefined,
      parentAccount: undefined,
    });

    expect(action.navigationParams).toEqual([
      NavigatorName.SendFunds,
      expect.objectContaining({
        screen: ScreenName.SendCoin,
        params: expect.objectContaining({
          extra: expect.objectContaining({ isSelfTransfer: true }),
        }),
      }),
    ]);
  });
});
