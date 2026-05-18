import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import { PnlDetail, type PnlDetailProps } from "../index";

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

const makeProps = (overrides: Partial<PnlDetailProps> = {}): PnlDetailProps => ({
  title: TITLE,
  description: DESCRIPTION,
  items: [...ITEMS],
  open: true,
  onOpenChange: jest.fn(),
  ...overrides,
});

describe("PnlDetail", () => {
  it("does not render the dialog when `open` is false", () => {
    render(<PnlDetail {...makeProps({ open: false })} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders title, description, and every item when open", () => {
    render(<PnlDetail {...makeProps()} />);

    expect(screen.getByRole("dialog")).toBeVisible();
    expect(screen.getByText(TITLE, { selector: "div" })).toBeVisible();
    expect(screen.getByText(DESCRIPTION, { selector: "div" })).toBeVisible();
    for (const { title, description, value } of ITEMS) {
      expect(screen.getByText(title)).toBeVisible();
      expect(screen.getByText(description)).toBeVisible();
      expect(screen.getByText(value)).toBeVisible();
    }
  });

  it("invokes onOpenChange(false) when the close button is clicked", async () => {
    const onOpenChange = jest.fn();
    const { user } = render(<PnlDetail {...makeProps({ onOpenChange })} />);

    await user.click(screen.getByRole("button", { name: /close/i }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });
});
