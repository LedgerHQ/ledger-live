import React from "react";
import { LedgerDevices } from "@ledgerhq/lumen-ui-react/symbols";
import { render, screen } from "tests/testSetup";
import * as UseMyLedgerViewModel from "./hooks/useMyLedgerViewModel";
import { MyLedger } from "./index";

jest.mock("./hooks/useMyLedgerViewModel", () => ({
  useMyLedgerViewModel: jest.fn(),
}));

const handleClick = jest.fn();

describe("MyLedger", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(UseMyLedgerViewModel, "useMyLedgerViewModel").mockReturnValue({
      title: "My Ledger",
      description: "Manage your Ledger device",
      icon: LedgerDevices,
      handleClick,
    });
  });

  it("should display the my ledger item", () => {
    render(<MyLedger />);

    expect(screen.getByText("My Ledger")).toBeVisible();
    expect(screen.getByText("Manage your Ledger device")).toBeVisible();
  });

  it("should trigger handleClick when clicked", async () => {
    const { user } = render(<MyLedger />);

    await user.click(screen.getByText("My Ledger"));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
