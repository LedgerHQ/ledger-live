import { IconsLegacy } from "@ledgerhq/native-ui";
import accountActions from "./accountActions";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";

// --- module mocks ---

jest.mock("@ledgerhq/native-ui", () => ({
  IconsLegacy: {
    TransferMedium: "TransferMedium",
  },
}));

jest.mock("~/context/Locale", () => ({
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
}));

// --- fixtures ---

const mockAccount = { id: "aleo-account-1" } as AleoAccount;

// --- tests ---

describe("accountActions – getMainActions", () => {
  it("returns exactly one action", () => {
    const actions = accountActions.getMainActions({ account: mockAccount });
    expect(actions).toHaveLength(1);
  });

  it("action has id 'publicToPrivate'", () => {
    const [action] = accountActions.getMainActions({ account: mockAccount });
    expect(action.id).toBe("publicToPrivate");
  });

  it("label uses translation key 'aleo.accountActions.publicToPrivate'", () => {
    const [action] = accountActions.getMainActions({ account: mockAccount });
    expect((action.label as { props: { i18nKey: string } }).props.i18nKey).toBe(
      "aleo.accountActions.publicToPrivate",
    );
  });

  it("icon is IconsLegacy.TransferMedium", () => {
    const [action] = accountActions.getMainActions({ account: mockAccount });
    expect(action.Icon).toBe(IconsLegacy.TransferMedium);
  });

  it("event is 'button_clicked'", () => {
    const [action] = accountActions.getMainActions({ account: mockAccount });
    expect(action.event).toBe("button_clicked");
  });

  it("eventProperties identify the public_to_private ALEO action", () => {
    const [action] = accountActions.getMainActions({ account: mockAccount });
    expect(action.eventProperties).toEqual({
      button: "public_to_private",
      currency: "ALEO",
      page: "Account Page",
    });
  });

  it("customHandler is a function", () => {
    const [action] = accountActions.getMainActions({ account: mockAccount });
    expect(typeof action.customHandler).toBe("function");
  });
});
