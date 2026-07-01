import { IconsLegacy } from "@ledgerhq/native-ui";
import accountActions from "../accountActions";
import { ALEO_ACCOUNT_1 } from "../__mocks__/account.mock";

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
    expect(typeof action.customHandler).toBe("function");
  });
});
