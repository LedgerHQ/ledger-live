import React from "react";
import BigNumber from "bignumber.js";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { ZcashSaplingRecipientNotSupported } from "@ledgerhq/coin-bitcoin/errors";
import { InvalidAddress } from "@ledgerhq/errors";
import SendRecipientFields from "../SendRecipientFields";

const baseAccount = createFixtureAccount();

const buildZcashAccount = () =>
  ({
    ...baseAccount,
    balance: new BigNumber(100_000_000),
    currency: { id: "zcash", name: "Zcash" } as CryptoCurrency,
  }) as unknown as typeof baseAccount;

const buildBitcoinAccount = () =>
  ({
    ...baseAccount,
    currency: { id: "bitcoin", name: "Bitcoin" } as CryptoCurrency,
  }) as unknown as typeof baseAccount;

// Helper to render the component (component prop from the exported object)
const renderComponent = (
  account: ReturnType<typeof createFixtureAccount>,
  status: { errors: { recipient?: Error } } | undefined,
  flagEnabled = true,
) => {
  return render(
    <SendRecipientFields.component
      account={account as never}
      parentAccount={null}
      confirmationsNb={0}
      transaction={undefined as never}
      status={status as never}
      onChange={jest.fn()}
    />,
    {
      initialState: withFlagOverrides({ zcashShielded: { enabled: flagEnabled } }),
    },
  );
};

describe("SendRecipientFields — Zcash shielded recipient feedback", () => {
  it("renders Sapling error alert for zcash account + flag on + sapling error", () => {
    renderComponent(
      buildZcashAccount(),
      { errors: { recipient: new ZcashSaplingRecipientNotSupported() } },
      true,
    );
    // TranslatedError looks up the error name in i18n; in tests it falls back to the key
    expect(screen.getByText(/sapling/i)).toBeInTheDocument();
  });

  it("renders no Zcash alert when status has no recipient error", () => {
    renderComponent(buildZcashAccount(), { errors: {} }, true);
    // Should not throw; no zcash alert rendered
    expect(screen.queryByText(/sapling/i)).not.toBeInTheDocument();
  });

  it("renders no Zcash alert when flag is off", () => {
    renderComponent(
      buildZcashAccount(),
      { errors: { recipient: new ZcashSaplingRecipientNotSupported() } },
      false, // flag off
    );
    expect(screen.queryByText(/sapling/i)).not.toBeInTheDocument();
  });

  it("renders no Zcash alert for a non-Zcash account even with flag on and error", () => {
    renderComponent(
      buildBitcoinAccount(),
      { errors: { recipient: new InvalidAddress() } },
      true,
    );
    expect(screen.queryByText(/sapling/i)).not.toBeInTheDocument();
  });

  it("renders no Zcash alert when status is undefined", () => {
    renderComponent(buildZcashAccount(), undefined, true);
    // No crash
    expect(screen.queryByText(/sapling/i)).not.toBeInTheDocument();
  });
});

describe("SendRecipientFields — existing pending-operation alert regression", () => {
  it("renders no alert for a bitcoin account with no pending operations", () => {
    const account = buildBitcoinAccount();
    renderComponent(account, { errors: {} }, false);
    // No pending operations, no alert
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
