import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "tests/testSetup";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { PRIVATE_BALANCE_PLACEHOLDER } from "../constants";
import BalanceSelector from "./BalanceSelector";
import { ALEO_ACCOUNT_1 } from "../__mocks__/account.mock";
import { makeAleoTransaction } from "../__mocks__/transaction.mock";

jest.mock("~/renderer/hooks/useAccountUnit");

const mockUseAccountUnit = jest.mocked(useAccountUnit);

describe("BalanceSelector", () => {
  const mockAccount: AleoAccount = {
    ...ALEO_ACCOUNT_1,
    aleoResources: {
      transparentBalance: new BigNumber(100_000_000),
      privateBalance: new BigNumber(50_000_000),
      provableApi: null,
      unspentPrivateRecords: [],
      lastPrivateSyncDate: null,
    },
  };

  const onChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAccountUnit.mockReturnValue({
      code: "ALEO",
      name: "Aleo",
      magnitude: 6,
    });
  });

  describe("when transaction is a public transfer", () => {
    it("should render public and private balance options", () => {
      render(
        <BalanceSelector
          transaction={makeAleoTransaction({ mode: "transfer_public" })}
          mainAccount={mockAccount}
          onChange={onChange}
        />,
      );

      expect(screen.getByText(/Public balance/)).toBeInTheDocument();
      expect(screen.getByText(/Private balance/)).toBeInTheDocument();
    });

    it("should call onChange with 'private' when the private option is clicked", async () => {
      const { user } = render(
        <BalanceSelector
          transaction={makeAleoTransaction({ mode: "transfer_public" })}
          mainAccount={mockAccount}
          onChange={onChange}
        />,
      );

      await user.click(screen.getByRole("button", { name: /Private/ }));

      expect(onChange).toHaveBeenCalledWith("private");
    });

    it("should call onChange with 'public' when the public option is clicked", async () => {
      const { user } = render(
        <BalanceSelector
          transaction={makeAleoTransaction({ mode: "transfer_public" })}
          mainAccount={mockAccount}
          onChange={onChange}
        />,
      );

      await user.click(screen.getByRole("button", { name: /Public/ }));

      expect(onChange).toHaveBeenCalledWith("public");
    });
  });

  describe("when transaction is a private transfer", () => {
    it("should render public and private balance options", () => {
      render(
        <BalanceSelector
          transaction={makeAleoTransaction({ mode: "transfer_private" })}
          mainAccount={mockAccount}
          onChange={onChange}
        />,
      );

      expect(screen.getByText(/Public balance/)).toBeInTheDocument();
      expect(screen.getByText(/Private balance/)).toBeInTheDocument();
    });

    it("should call onChange with 'public' when the public option is clicked", async () => {
      const { user } = render(
        <BalanceSelector
          transaction={makeAleoTransaction({ mode: "transfer_private" })}
          mainAccount={mockAccount}
          onChange={onChange}
        />,
      );

      await user.click(screen.getByRole("button", { name: /Public/ }));

      expect(onChange).toHaveBeenCalledWith("public");
    });

    it("should call onChange with 'private' when the private option is clicked", async () => {
      const { user } = render(
        <BalanceSelector
          transaction={makeAleoTransaction({ mode: "transfer_private" })}
          mainAccount={mockAccount}
          onChange={onChange}
        />,
      );

      await user.click(screen.getByRole("button", { name: /Private/ }));

      expect(onChange).toHaveBeenCalledWith("private");
    });
  });

  describe("when transaction is a self-transfer (convert_public_to_private)", () => {
    it("should render public and private balance options as enabled", () => {
      render(
        <BalanceSelector
          transaction={makeAleoTransaction({ mode: "convert_public_to_private" })}
          mainAccount={mockAccount}
          onChange={onChange}
        />,
      );

      const disabledButtons = screen
        .getAllByRole("button")
        .filter(btn => btn.hasAttribute("disabled"));

      expect(disabledButtons.length).toBe(0);
      expect(screen.getByText(/Public balance/)).toBeInTheDocument();
      expect(screen.getByText(/Private balance/)).toBeInTheDocument();
    });

    it("should call onChange with 'private' when the switch button is clicked", async () => {
      const { user } = render(
        <BalanceSelector
          transaction={makeAleoTransaction({ mode: "convert_public_to_private" })}
          mainAccount={mockAccount}
          onChange={onChange}
        />,
      );

      await user.click(screen.getByRole("button", { name: /switch balance source/i }));

      expect(onChange).toHaveBeenCalledWith("private");
    });
  });

  describe("when transaction is a self-transfer (convert_private_to_public)", () => {
    it("should render public and private balance options as enabled", () => {
      render(
        <BalanceSelector
          transaction={makeAleoTransaction({ mode: "convert_private_to_public" })}
          mainAccount={mockAccount}
          onChange={onChange}
        />,
      );

      const disabledButtons = screen
        .getAllByRole("button")
        .filter(btn => btn.hasAttribute("disabled"));

      expect(disabledButtons.length).toBe(0);
    });

    it("should call onChange with 'public' when the switch button is clicked", async () => {
      const { user } = render(
        <BalanceSelector
          transaction={makeAleoTransaction({ mode: "convert_private_to_public" })}
          mainAccount={mockAccount}
          onChange={onChange}
        />,
      );

      await user.click(screen.getByRole("button", { name: /switch balance source/i }));

      expect(onChange).toHaveBeenCalledWith("public");
    });
  });

  it("should display the private balance placeholder when privateBalance is null", () => {
    const accountWithNullPrivate: AleoAccount = {
      ...mockAccount,
      aleoResources: {
        ...mockAccount.aleoResources!,
        privateBalance: null,
      },
    };

    render(
      <BalanceSelector
        transaction={makeAleoTransaction({ mode: "transfer_public" })}
        mainAccount={accountWithNullPrivate}
        onChange={onChange}
      />,
    );

    expect(screen.getByText(PRIVATE_BALANCE_PLACEHOLDER)).toBeInTheDocument();
  });
});
