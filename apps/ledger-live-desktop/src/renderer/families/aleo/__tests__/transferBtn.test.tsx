import React from "react";
import { render, screen } from "tests/testSetup";
import userEvent from "@testing-library/user-event";
import { TransferBtn, TransferBtnProps } from "../shared/TransferBtn";

describe("TransferBtn", () => {
  const getDefaultProps = (overrides: Partial<TransferBtnProps> = {}): TransferBtnProps => ({
    isSelfTransfer: false,
    checked: false,
    onClick: jest.fn(),
    disabled: false,
    balanceType: "Public",
    balance: "1000 ALEO",
    lastSyncDate: "2024-01-15",
    lastSyncTime: "10:30 AM",
    ...overrides,
  });

  describe("Standard Transfer Mode", () => {
    it("renders public balance with all information", () => {
      render(<TransferBtn {...getDefaultProps()} />);

      expect(screen.getByText("Public balance")).toBeInTheDocument();
      expect(screen.getByText("1000 ALEO")).toBeInTheDocument();
      expect(screen.getByText("Last update: 2024-01-15")).toBeInTheDocument();
      expect(screen.getByText("(10:30 AM)")).toBeInTheDocument();
    });

    it("renders private balance type", () => {
      render(<TransferBtn {...getDefaultProps({ balanceType: "Private" })} />);

      expect(screen.getByText("Private balance")).toBeInTheDocument();
    });

    it("renders dash when balance is null", () => {
      render(<TransferBtn {...getDefaultProps({ balance: null })} />);

      expect(screen.getByText("-")).toBeInTheDocument();
    });

    it("does not render last sync date when null", () => {
      render(<TransferBtn {...getDefaultProps({ lastSyncDate: null, lastSyncTime: null })} />);

      expect(screen.queryByText(/Last update:/)).not.toBeInTheDocument();
    });

    it("renders last sync date without time when time is null", () => {
      render(<TransferBtn {...getDefaultProps({ lastSyncTime: null })} />);

      expect(screen.getByText("Last update: 2024-01-15")).toBeInTheDocument();
      expect(screen.queryByText(/\(/)).not.toBeInTheDocument();
    });
  });

  describe("Self Transfer Mode", () => {
    it("renders in self-transfer layout", () => {
      render(<TransferBtn {...getDefaultProps({ isSelfTransfer: true })} />);

      expect(screen.getByText("Public balance")).toBeInTheDocument();
      expect(screen.getByText("1000 ALEO")).toBeInTheDocument();
      expect(screen.getByText("Last update: 2024-01-15 (10:30 AM)")).toBeInTheDocument();
    });

    it("does not render last update in self-transfer when sync data is null", () => {
      render(
        <TransferBtn
          {...getDefaultProps({
            isSelfTransfer: true,
            lastSyncDate: null,
            lastSyncTime: null,
          })}
        />,
      );

      expect(screen.queryByText(/Last update:/)).not.toBeInTheDocument();
    });

    it("renders balance value in self-transfer mode", () => {
      render(<TransferBtn {...getDefaultProps({ isSelfTransfer: true, balance: "5000 ALEO" })} />);

      expect(screen.getByText("5000 ALEO")).toBeInTheDocument();
    });

    it("renders dash when balance is null in self-transfer mode", () => {
      render(<TransferBtn {...getDefaultProps({ isSelfTransfer: true, balance: null })} />);

      expect(screen.getByText("-")).toBeInTheDocument();
    });
  });

  describe("Checked State", () => {
    it("applies correct styles when checked", () => {
      const { container } = render(<TransferBtn {...getDefaultProps({ checked: true })} />);

      const button = container.querySelector("button");
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute("type", "button");
    });

    it("applies correct styles when unchecked", () => {
      const { container } = render(<TransferBtn {...getDefaultProps({ checked: false })} />);

      const button = container.querySelector("button");
      expect(button).toBeInTheDocument();
    });
  });

  describe("Disabled State", () => {
    it("renders as disabled button", () => {
      const { container } = render(<TransferBtn {...getDefaultProps({ disabled: true })} />);

      const button = container.querySelector("button");
      expect(button).toBeDisabled();
    });

    it("does not call onClick when disabled", async () => {
      const user = userEvent.setup();
      const onClickMock = jest.fn();
      const { container } = render(
        <TransferBtn {...getDefaultProps({ disabled: true, onClick: onClickMock })} />,
      );

      const button = container.querySelector("button");
      if (button) {
        await user.click(button);
      }

      expect(onClickMock).not.toHaveBeenCalled();
    });
  });

  describe("Click Interactions", () => {
    it("calls onClick when button is clicked", async () => {
      const user = userEvent.setup();
      const onClickMock = jest.fn();
      const { container } = render(<TransferBtn {...getDefaultProps({ onClick: onClickMock })} />);

      const button = container.querySelector("button");
      if (button) {
        await user.click(button);
      }

      expect(onClickMock).toHaveBeenCalledTimes(1);
    });

    it("can be clicked multiple times", async () => {
      const user = userEvent.setup();
      const onClickMock = jest.fn();
      const { container } = render(<TransferBtn {...getDefaultProps({ onClick: onClickMock })} />);

      const button = container.querySelector("button");
      if (button) {
        await user.click(button);
        await user.click(button);
        await user.click(button);
      }

      expect(onClickMock).toHaveBeenCalledTimes(3);
    });
  });

  describe("Button Type", () => {
    it("renders as button type", () => {
      const { container } = render(<TransferBtn {...getDefaultProps()} />);

      const button = container.querySelector('button[type="button"]');
      expect(button).toBeInTheDocument();
    });
  });

  describe("Balance Display Variations", () => {
    it("handles different balance formats", () => {
      render(<TransferBtn {...getDefaultProps({ balance: "0.000001 ALEO" })} />);

      expect(screen.getByText("0.000001 ALEO")).toBeInTheDocument();
    });

    it("handles large balance values", () => {
      render(<TransferBtn {...getDefaultProps({ balance: "999,999.999 ALEO" })} />);

      expect(screen.getByText("999,999.999 ALEO")).toBeInTheDocument();
    });
  });

  describe("Combined Props", () => {
    it("handles disabled and checked states together", () => {
      const { container } = render(
        <TransferBtn {...getDefaultProps({ disabled: true, checked: true })} />,
      );

      const button = container.querySelector("button");
      expect(button).toBeDisabled();
    });

    it("handles self-transfer with private balance", () => {
      render(
        <TransferBtn
          {...getDefaultProps({
            isSelfTransfer: true,
            balanceType: "Private",
            balance: "2500 ALEO",
          })}
        />,
      );

      expect(screen.getByText("Private balance")).toBeInTheDocument();
      expect(screen.getByText("2500 ALEO")).toBeInTheDocument();
    });
  });
});
