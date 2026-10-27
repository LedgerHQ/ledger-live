import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

describe("AccountNotices (Web)", () => {
  it("renders nothing without notices", () => {
    const { container } = render(
      <AccountNotices notices={[]} onOpenLink={jest.fn()} onOpenPerps={jest.fn()} />,
      { wrapper: I18nWrapper },
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("shows the migration and opens its link", async () => {
    const { onOpenLink, user } = renderNotices([
      {
        id: "migration",
        from: "Elrond",
        to: "MultiversX",
        action: { type: "learnMore", link: "https://ledger.com/migration" },
      },
    ]);

    expect(screen.getByText("Elrond is migrating to MultiversX")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Learn more" }));

    expect(onOpenLink).toHaveBeenCalledWith("https://ledger.com/migration");
  });

  it("shows the Robinhood disclaimer without any action", () => {
    renderNotices([{ id: "robinhoodDisclaimer" }]);

    expect(
      screen.getByText("Total balance does not include dividends or stock splits."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("opens Perps from the Perps notice", async () => {
    const { onOpenPerps, user } = renderNotices([{ id: "perps", action: { type: "openPerps" } }]);

    await user.click(screen.getByRole("button", { name: "Open Perps" }));

    expect(onOpenPerps).toHaveBeenCalledTimes(1);
  });

  it("shows the remote custom banner text", () => {
    renderNotices([{ id: "custom", text: "Network upgrade on Monday" }]);

    expect(screen.getByText("Network upgrade on Monday")).toBeInTheDocument();
  });
});
