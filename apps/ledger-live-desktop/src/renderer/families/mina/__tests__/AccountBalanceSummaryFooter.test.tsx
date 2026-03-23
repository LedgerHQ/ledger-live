import React from "react";
import { render, screen } from "tests/testSetup";
import AccountBalanceSummaryFooter from "../AccountBalanceSummaryFooter";
import { createMockMinaAccount, createDelegatingMinaAccount, mockValidators } from "./testUtils";
import * as currencies from "@ledgerhq/live-common/currencies/index";

jest.mock("~/renderer/hooks/useAccountUnit");
jest.mock("@ledgerhq/live-common/currencies/index");

describe("AccountBalanceSummaryFooter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .spyOn(currencies, "formatCurrencyUnit")
      .mockReturnValue("10 MINA");
  });

  it("renders nothing when account has no active delegation", () => {
    const account = createMockMinaAccount();

    const { container } = render(<AccountBalanceSummaryFooter account={account} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("displays delegation info when account has active delegation", () => {
    const account = createDelegatingMinaAccount(mockValidators[0]);

    render(<AccountBalanceSummaryFooter account={account} />);

    expect(screen.getByText(mockValidators[0].identityName)).toBeInTheDocument();
    expect(screen.getByText("10 MINA")).toBeInTheDocument();
    expect(screen.getByText(mockValidators[0].address)).toBeInTheDocument();
  });

  it("displays the correct validator identity name", () => {
    const account = createDelegatingMinaAccount(mockValidators[1]);

    render(<AccountBalanceSummaryFooter account={account} />);

    expect(screen.getByText(mockValidators[1].identityName)).toBeInTheDocument();
  });

  it("displays the producer address", () => {
    const account = createDelegatingMinaAccount(mockValidators[0]);

    render(<AccountBalanceSummaryFooter account={account} />);

    expect(screen.getByText(mockValidators[0].address)).toBeInTheDocument();
  });

  it("renders nothing when account type is not Account", () => {
    const account = createDelegatingMinaAccount();
    (account as unknown as { type: string }).type = "TokenAccount";

    const { container } = render(<AccountBalanceSummaryFooter account={account} />);

    expect(container).toBeEmptyDOMElement();
  });
});
