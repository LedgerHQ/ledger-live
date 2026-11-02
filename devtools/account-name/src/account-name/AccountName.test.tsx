import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AccountName from "./AccountName";

const names = [
  { legacyId: "js:2:ethereum:0xabc:", accountUUID: "uuid-1", name: "Savings", isDefault: false },
  { legacyId: "js:2:bitcoin:xpub:", accountUUID: "uuid-2", name: "Bitcoin 1", isDefault: true },
  { legacyId: "js:2:ethereum:0xabc:+usdc", name: "Stables", isDefault: false },
];

const nameOf = (accountUUID: string) => (accountUUID === "uuid-1" ? "Savings" : undefined);

describe("AccountName", () => {
  it("shows one row per account, a dash when no account UUID is known", () => {
    render(<AccountName names={names} nameOf={nameOf} />);
    expect(screen.getByText("2 custom, 1 default")).toBeVisible();
    expect(screen.getByText("uuid-1")).toBeVisible();
    expect(screen.getByText("Stables")).toBeVisible();
    expect(screen.getByText("—")).toBeVisible();
  });

  it("greys out an account showing its default name", () => {
    render(<AccountName names={names} nameOf={nameOf} />);
    expect(screen.getByText("Bitcoin 1").closest("tr")).toHaveClass("text-muted");
    expect(screen.getByText("Savings").closest("tr")).not.toHaveClass("text-muted");
  });

  it("looks a name up by account UUID", async () => {
    render(<AccountName names={[]} nameOf={nameOf} />);
    await userEvent.type(screen.getByRole("textbox", { name: "Account UUID" }), "uuid-1");
    expect(screen.getByText("Savings")).toBeVisible();
  });

  it("says when an account UUID has no custom name", async () => {
    render(<AccountName names={[]} nameOf={nameOf} />);
    await userEvent.type(screen.getByRole("textbox", { name: "Account UUID" }), "uuid-2");
    expect(screen.getByText("No custom name for this account")).toBeVisible();
  });
});
