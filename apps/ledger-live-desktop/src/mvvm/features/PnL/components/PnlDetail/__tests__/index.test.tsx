import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import { PnlDetail } from "../index";

const TITLE = "Profit and loss";
const DESCRIPTION = "Your portfolio performance broken down into realised and unrealised returns.";
const ITEMS = [
  { title: "Realised return", description: "Profits taken from sold positions.", value: "$120.00" },
  {
    title: "Unrealised return",
    description: "Estimated gain or loss on your current holdings.",
    value: "$243.32",
  },
] as const;

const DEFAULT_PROPS = { title: TITLE, description: DESCRIPTION, items: [...ITEMS] };

async function openDialog(user: ReturnType<typeof render>["user"]) {
  await user.click(screen.getByRole("button", { name: /open dialog/i }));
  await waitFor(() => expect(screen.getByRole("dialog")).toBeVisible());
}

describe("PnlDetail", () => {
  it("does not render the dialog before the trigger is clicked", () => {
    render(<PnlDetail {...DEFAULT_PROPS} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the trigger button", () => {
    render(<PnlDetail {...DEFAULT_PROPS} />);

    expect(screen.getByRole("button", { name: /open dialog/i })).toBeVisible();
  });

  it("opens the dialog with title and description when the trigger is clicked", async () => {
    const { user } = render(<PnlDetail {...DEFAULT_PROPS} />);
    await openDialog(user);

    // Radix also renders a sr-only h2/p for a11y — scope to div to target the visible elements
    expect(screen.getByText(TITLE, { selector: "div" })).toBeVisible();
    expect(screen.getByText(DESCRIPTION, { selector: "div" })).toBeVisible();
  });

  it("renders every item when the dialog is open", async () => {
    const { user } = render(<PnlDetail {...DEFAULT_PROPS} />);
    await openDialog(user);

    for (const { title, description, value } of ITEMS) {
      expect(screen.getByText(title)).toBeVisible();
      expect(screen.getByText(description)).toBeVisible();
      expect(screen.getByText(value)).toBeVisible();
    }
  });

  it("masks all item values behind '***' when the store has discreet mode enabled", async () => {
    const { user } = render(<PnlDetail {...DEFAULT_PROPS} />, {
      initialState: { settings: { discreetMode: true } },
    });
    await openDialog(user);

    expect(screen.getAllByText("***")).toHaveLength(ITEMS.length);
    for (const { value } of ITEMS) {
      expect(screen.queryByText(value)).not.toBeInTheDocument();
    }
  });

  it("closes the dialog when the close button is clicked", async () => {
    const { user } = render(<PnlDetail {...DEFAULT_PROPS} />);
    await openDialog(user);

    await user.click(screen.getByRole("button", { name: /close/i }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
