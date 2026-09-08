import React from "react";
import { render, screen } from "@tests/test-renderer";
import AccountBalanceFooter from "../AccountBalanceSummaryFooter";
import { createMockMinaAccount, createDelegatingMinaAccount, mockValidators } from "./testUtils";

describe("AccountBalanceSummaryFooter", () => {
  it("renders nothing when account has no delegation", () => {
    const { toJSON } = render(<AccountBalanceFooter account={createMockMinaAccount()} />);

    expect(toJSON()).toBeNull();
  });

  it("renders nothing when account type is not Account", () => {
    const account = createMockMinaAccount({ type: "TokenAccount" as "Account" });
    const { toJSON } = render(<AccountBalanceFooter account={account} />);

    expect(toJSON()).toBeNull();
  });

  it("renders delegation info when account has active delegation", () => {
    render(<AccountBalanceFooter account={createDelegatingMinaAccount(mockValidators[0])} />);

    expect(screen.getByText("Delegated to")).toBeOnTheScreen();
    expect(screen.getByText("Delegated Balance")).toBeOnTheScreen();
    expect(screen.getByText("Producer Address")).toBeOnTheScreen();
  });

  it("displays the validator identity name and the producer address", () => {
    render(<AccountBalanceFooter account={createDelegatingMinaAccount(mockValidators[0])} />);

    expect(screen.getByText(mockValidators[0].identityName)).toBeOnTheScreen();
    expect(screen.getByText(mockValidators[0].address)).toBeOnTheScreen();
  });

  it("falls back to a dash when the delegate metadata is missing", () => {
    render(<AccountBalanceFooter account={createDelegatingMinaAccount(null)} />);

    expect(screen.getAllByText("-")).toHaveLength(2);
  });
});
