import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { I18nWrapper } from "../../__tests__/i18nWrapper";
import type { AccountNotice } from "../../model/types";
import { AccountNotices } from "./AccountNotices";

const TEST_ID = "notices";

function renderNotices(notices: readonly AccountNotice[]) {
  const handlers = { onOpenLink: jest.fn(), onOpenPerps: jest.fn() };
  render(<AccountNotices notices={notices} {...handlers} testID={TEST_ID} />, {
    wrapper: I18nWrapper,
  });
  return { ...handlers, user: userEvent.setup() };
}

describe("AccountNotices (Native)", () => {
  it("shows the migration with its parameters and opens its link", async () => {
    const { onOpenLink, user } = renderNotices([
      {
        id: "migration",
        from: "Elrond",
        to: "MultiversX",
        action: { type: "learnMore", link: "https://ledger.com/migration" },
      },
    ]);

    expect(screen.getByText("Elrond is migrating to MultiversX")).toBeVisible();
    await user.press(screen.getByTestId(`${TEST_ID}-migration-action`));

    expect(onOpenLink).toHaveBeenCalledWith("https://ledger.com/migration");
  });

  it("shows the Robinhood disclaimer without any action", () => {
    renderNotices([{ id: "robinhoodDisclaimer" }]);

    expect(
      screen.getByText("Total balance does not include dividends or stock splits."),
    ).toBeVisible();
    expect(screen.queryByTestId(`${TEST_ID}-robinhoodDisclaimer-action`)).toBeNull();
  });

  it("opens Perps from the Perps notice", async () => {
    const { onOpenPerps, user } = renderNotices([{ id: "perps", action: { type: "openPerps" } }]);

    await user.press(screen.getByTestId(`${TEST_ID}-perps-action`));

    expect(onOpenPerps).toHaveBeenCalledTimes(1);
  });
});
