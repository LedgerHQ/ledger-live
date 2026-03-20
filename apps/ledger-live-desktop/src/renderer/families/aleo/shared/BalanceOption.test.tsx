import React from "react";
import { render, screen } from "tests/testSetup";
import { BalanceOption } from "./BalanceOption";

describe("BalanceOption", () => {
  const defaultProps = {
    checked: false,
    label: "Public",
    balance: "100 ALEO",
  };

  it("should render the balance value", () => {
    render(<BalanceOption {...defaultProps} />);

    expect(screen.getByText("100 ALEO")).toBeInTheDocument();
  });

  it("should render '-' when balance is null", () => {
    render(<BalanceOption {...defaultProps} balance={null} />);

    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("should call onClick when clicked", async () => {
    const onClick = jest.fn();
    const { user } = render(<BalanceOption {...defaultProps} onClick={onClick} />);

    await user.click(screen.getByRole("button"));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("should render the button as disabled when the disabled prop is set", () => {
    render(<BalanceOption {...defaultProps} disabled />);

    expect(screen.getByRole("button")).toBeDisabled();
  });

  describe("non self-transfer layout", () => {
    it("should render lastSyncDate and lastSyncTime in separate elements when both are provided", () => {
      render(<BalanceOption {...defaultProps} lastSyncDate="2024-01-01" lastSyncTime="12:00" />);

      expect(screen.getByText(/Last updated.*2024-01-01/)).toBeInTheDocument();
      expect(screen.getByText("(12:00)")).toBeInTheDocument();
    });

    it("should not render sync info when lastSyncDate is not provided", () => {
      render(<BalanceOption {...defaultProps} />);

      expect(screen.queryByText(/Last updated/)).not.toBeInTheDocument();
    });

    it("should not render lastSyncTime element when lastSyncTime is not provided", () => {
      render(<BalanceOption {...defaultProps} lastSyncDate="2024-01-01" />);

      expect(screen.getByText(/Last updated.*2024-01-01/)).toBeInTheDocument();
      expect(screen.queryByText(/\(.*\)/)).not.toBeInTheDocument();
    });
  });

  describe("self-transfer layout", () => {
    it("should render lastSyncDate and lastSyncTime as combined text when both are provided", () => {
      render(
        <BalanceOption
          {...defaultProps}
          isSelfTransfer
          lastSyncDate="2024-01-01"
          lastSyncTime="12:00"
        />,
      );

      expect(screen.getByText(/Last updated.*2024-01-01.*12:00/)).toBeInTheDocument();
    });

    it("should render sync info with only lastSyncDate when lastSyncTime is not provided", () => {
      render(<BalanceOption {...defaultProps} isSelfTransfer lastSyncDate="2024-01-01" />);

      expect(screen.getByText(/Last updated.*2024-01-01/)).toBeInTheDocument();
      expect(screen.queryByText(/\(.*\)/)).not.toBeInTheDocument();
    });

    it("should not render sync info when lastSyncDate is missing", () => {
      render(<BalanceOption {...defaultProps} isSelfTransfer />);

      expect(screen.queryByText(/Last updated/)).not.toBeInTheDocument();
    });
  });
});
