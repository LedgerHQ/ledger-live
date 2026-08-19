import React from "react";
import BigNumber from "bignumber.js";
import { DEFAULT_ZCASH_PRIVATE_INFO } from "@ledgerhq/coin-zcash/constants";
import { render, screen, fireEvent, withFlagOverrides } from "tests/testSetup";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import { CryptoCurrency } from "@domain/entity-currency-crypto";
import { Account } from "@ledgerhq/types-live";
import { Transaction } from "@ledgerhq/live-common/families/bitcoin/types";
import type { Transaction as ZcashCoinTransaction } from "@ledgerhq/coin-zcash/types";
import ZcashSelfTransferToggle from "../ZcashSelfTransferToggle";

// The bridge's updateTransaction merges the patch onto the transaction
// (see libs/ledger-wallet-framework/.../jsHelpers.ts). Replicate that here.
jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({
    updateTransaction: (tx: Transaction, patch: Partial<Transaction>) => ({ ...tx, ...patch }),
  }),
}));

const baseAccount = createFixtureAccount();

const FRESH_ADDRESS = "1fMK6i7CMDES1GNGDEMX5ddDaxbkjWPw1M";
const SHIELDED_ADDRESS =
  "u1u2h4ce7e2cn3z4nzur95muq2dl4da9x8h8kdp2l80gm9nl9raj8zzpx79ycjnfvar4v5exea5pqr5y9qsnlp0cdunwf9yjjx5c4q7ar9";
const TESTNET_SHIELDED_ADDRESS =
  "utest1u2h4ce7e2cn3z4nzur95muq2dl4da9x8h8kdp2l80gm9nl9raj8zzpx79ycjnfvar4v5exea5pqr5y9qsnlp0cdunwf9yjjx5c4q7a";

const buildAccount = (overrides: Partial<typeof DEFAULT_ZCASH_PRIVATE_INFO> = {}, isZcash = true) =>
  ({
    ...baseAccount,
    freshAddress: FRESH_ADDRESS,
    balance: new BigNumber(100_000_000),
    currency: { id: isZcash ? "zcash" : "bitcoin" } as CryptoCurrency,
    privateInfo: {
      ...DEFAULT_ZCASH_PRIVATE_INFO,
      ...overrides,
    },
  }) as unknown as Account;

// The toggle now gates on the zcashShielded flag itself (it is rendered
// directly as a family slot, not nested under the flag-gated selector).
const shieldedOn = () => withFlagOverrides({ zcashShielded: { enabled: true } });

// coin-zcash's `sender`/`selfTransfer` fields don't exist on the bitcoin
// family's own Transaction type (the component receives it typed that way,
// per `@ledgerhq/live-common/families/bitcoin/types`). Author fixtures against
// the real coin-zcash shape, then hand them across the family boundary the
// same way the component itself does (`as unknown as ZcashTransaction`).
const mkTx = (patch: Partial<ZcashCoinTransaction>): Transaction => patch as unknown as Transaction;

const renderToggle = (account: Account, transaction: Transaction, onChange = jest.fn()) => {
  render(
    <ZcashSelfTransferToggle account={account} transaction={transaction} onChange={onChange} />,
    { initialState: shieldedOn() },
  );
  return onChange;
};

describe("ZcashSelfTransferToggle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing when the zcashShielded feature flag is off", () => {
    render(
      <ZcashSelfTransferToggle
        account={buildAccount({ shieldedAddress: SHIELDED_ADDRESS, ufvk: "uview" })}
        transaction={mkTx({ sender: "public" })}
        onChange={jest.fn()}
      />,
    );
    expect(screen.queryByTestId("zcash-self-transfer-toggle")).not.toBeInTheDocument();
  });

  it("renders nothing for a non-Zcash account even when the flag is on", () => {
    render(
      <ZcashSelfTransferToggle
        account={buildAccount({ shieldedAddress: SHIELDED_ADDRESS, ufvk: "uview" }, false)}
        transaction={mkTx({ sender: "public" })}
        onChange={jest.fn()}
      />,
      { initialState: shieldedOn() },
    );
    expect(screen.queryByTestId("zcash-self-transfer-toggle")).not.toBeInTheDocument();
  });

  it("is off by default and does not patch the transaction on mount", () => {
    const onChange = renderToggle(
      buildAccount({ shieldedAddress: SHIELDED_ADDRESS, ufvk: "uview" }),
      mkTx({ sender: "public" }),
    );

    expect(screen.getByTestId("zcash-self-transfer-switch")).not.toBeChecked();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("fills the shielded address when the source is public and toggled on", () => {
    const onChange = renderToggle(
      buildAccount({ shieldedAddress: SHIELDED_ADDRESS, ufvk: "uview" }),
      mkTx({ sender: "public" }),
    );

    fireEvent.click(screen.getByTestId("zcash-self-transfer-switch"));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ selfTransfer: true, recipient: SHIELDED_ADDRESS }),
    );
  });

  it("fills the fresh address when the source is private and toggled on", () => {
    const onChange = renderToggle(buildAccount({ ufvk: "uview" }), mkTx({ sender: "private" }));

    fireEvent.click(screen.getByTestId("zcash-self-transfer-switch"));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ selfTransfer: true, recipient: FRESH_ADDRESS }),
    );
  });

  it("names the destination pool and flips the label with the source", () => {
    const { rerender } = render(
      <ZcashSelfTransferToggle
        account={buildAccount({ shieldedAddress: SHIELDED_ADDRESS, ufvk: "uview" })}
        transaction={mkTx({ sender: "public" })}
        onChange={jest.fn()}
      />,
      { initialState: shieldedOn() },
    );
    expect(screen.getByTestId("zcash-self-transfer-toggle")).toHaveTextContent(/private balance/i);

    rerender(
      <ZcashSelfTransferToggle
        account={buildAccount({ ufvk: "uview" })}
        transaction={mkTx({ sender: "private" })}
        onChange={jest.fn()}
      />,
    );
    expect(screen.getByTestId("zcash-self-transfer-toggle")).toHaveTextContent(/public balance/i);
  });

  it("clears the recipient and turns off when toggled off", () => {
    const onChange = renderToggle(
      buildAccount({ shieldedAddress: SHIELDED_ADDRESS, ufvk: "uview" }),
      mkTx({ sender: "public", selfTransfer: true, recipient: SHIELDED_ADDRESS }),
    );

    fireEvent.click(screen.getByTestId("zcash-self-transfer-switch"));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ selfTransfer: false, recipient: "" }),
    );
  });

  it("refills the recipient when the source flips while the toggle stays on (toggle-then-switch)", () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <ZcashSelfTransferToggle
        account={buildAccount({ shieldedAddress: SHIELDED_ADDRESS, ufvk: "uview" })}
        transaction={mkTx({ sender: "public", selfTransfer: true, recipient: SHIELDED_ADDRESS })}
        onChange={onChange}
      />,
      { initialState: shieldedOn() },
    );
    expect(onChange).not.toHaveBeenCalled();

    rerender(
      <ZcashSelfTransferToggle
        account={buildAccount({ shieldedAddress: SHIELDED_ADDRESS, ufvk: "uview" })}
        transaction={mkTx({ sender: "private", selfTransfer: true, recipient: SHIELDED_ADDRESS })}
        onChange={onChange}
      />,
    );

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ recipient: FRESH_ADDRESS }));
  });

  it("fills the fresh address directly when the source is already flipped before toggling on (switch-then-toggle)", () => {
    const onChange = renderToggle(
      buildAccount({ shieldedAddress: SHIELDED_ADDRESS, ufvk: "uview" }),
      mkTx({ sender: "private" }),
    );

    fireEvent.click(screen.getByTestId("zcash-self-transfer-switch"));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ selfTransfer: true, recipient: FRESH_ADDRESS }),
    );
  });

  // Switch renders on a Box/Tabbable, not a native <button>, so "disabled" is
  // asserted functionally: clicking it must not toggle it on.
  it("is unavailable and cannot be turned on when the shielded address is missing", () => {
    const onChange = renderToggle(
      buildAccount({ shieldedAddress: null, ufvk: "uview" }),
      mkTx({ sender: "public" }),
    );

    fireEvent.click(screen.getByTestId("zcash-self-transfer-switch"));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByTestId("zcash-self-transfer-unavailable")).toBeInTheDocument();
  });

  it("is unavailable and cannot be turned on when no UFVK is available", () => {
    const onChange = renderToggle(
      buildAccount({ shieldedAddress: SHIELDED_ADDRESS, ufvk: null }),
      mkTx({ sender: "public" }),
    );

    fireEvent.click(screen.getByTestId("zcash-self-transfer-switch"));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByTestId("zcash-self-transfer-unavailable")).toBeInTheDocument();
  });

  it("shows the privacy warning when de-shielding, not when shielding", () => {
    const { rerender } = render(
      <ZcashSelfTransferToggle
        account={buildAccount({ ufvk: "uview" })}
        transaction={mkTx({ sender: "private", selfTransfer: true })}
        onChange={jest.fn()}
      />,
      { initialState: shieldedOn() },
    );
    expect(screen.getByTestId("zcash-self-transfer-privacy-warning")).toBeInTheDocument();

    rerender(
      <ZcashSelfTransferToggle
        account={buildAccount({ shieldedAddress: SHIELDED_ADDRESS, ufvk: "uview" })}
        transaction={mkTx({ sender: "public", selfTransfer: true })}
        onChange={jest.fn()}
      />,
    );
    expect(screen.queryByTestId("zcash-self-transfer-privacy-warning")).not.toBeInTheDocument();
  });

  it("never infers selfTransfer from a pasted recipient that happens to match the target address", () => {
    const onChange = renderToggle(
      buildAccount({ shieldedAddress: SHIELDED_ADDRESS, ufvk: "uview" }),
      mkTx({ sender: "public", recipient: SHIELDED_ADDRESS }),
    );

    expect(screen.getByTestId("zcash-self-transfer-switch")).not.toBeChecked();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("clears and turns off when availability is lost while the toggle is on", () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <ZcashSelfTransferToggle
        account={buildAccount({ shieldedAddress: SHIELDED_ADDRESS, ufvk: "uview" })}
        transaction={mkTx({ sender: "public", selfTransfer: true, recipient: SHIELDED_ADDRESS })}
        onChange={onChange}
      />,
      { initialState: shieldedOn() },
    );
    expect(onChange).not.toHaveBeenCalled();

    rerender(
      <ZcashSelfTransferToggle
        account={buildAccount({ shieldedAddress: null, ufvk: "uview" })}
        transaction={mkTx({ sender: "public", selfTransfer: true, recipient: SHIELDED_ADDRESS })}
        onChange={onChange}
      />,
    );

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ selfTransfer: false, recipient: "" }),
    );
  });

  it("passes a testnet shielded address through verbatim, with no HRP branch", () => {
    const onChange = renderToggle(
      buildAccount({ shieldedAddress: TESTNET_SHIELDED_ADDRESS, ufvk: "uview" }),
      mkTx({ sender: "public" }),
    );

    fireEvent.click(screen.getByTestId("zcash-self-transfer-switch"));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ selfTransfer: true, recipient: TESTNET_SHIELDED_ADDRESS }),
    );
  });
});
