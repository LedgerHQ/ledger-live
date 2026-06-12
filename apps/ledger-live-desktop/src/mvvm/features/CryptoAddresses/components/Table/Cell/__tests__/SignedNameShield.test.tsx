import React from "react";
import { render, screen } from "tests/testSetup";
import type { AccountLike } from "@ledgerhq/types-live";
import { SignedNameShield } from "../SignedNameShield";

// The shield reads the contacts wallet through the useContacts boundary;
// mock it with a fixed accounts map so each case is deterministic.
const mockWallet = {
  contacts: {},
  accounts: {} as Record<
    string,
    { name: string; derivationPath: string; chainId: number; addressHex: string; hmacProofHex: string }
  >,
};

jest.mock("~/renderer/contacts/useContacts", () => ({
  __esModule: true,
  useContacts: () => ({ hydrated: true, wallet: mockWallet }),
}));

const DERIVATION_PATH = "44'/60'/0'/0/0";

// Minimal EVM main-account stub — only the fields SignedNameShield reads.
const evmAccount = {
  type: "Account",
  freshAddressPath: DERIVATION_PATH,
  currency: { ethereumLikeInfo: { chainId: 1 } },
} as unknown as AccountLike;

const registered = {
  name: "Ethereum 1",
  derivationPath: DERIVATION_PATH,
  chainId: 1,
  addressHex: "0x" + "a".repeat(40),
  hmacProofHex: "deadbeef",
};

beforeEach(() => {
  mockWallet.accounts = {};
});

describe("SignedNameShield", () => {
  it("renders the shield when the name is registered for this account on the device", () => {
    mockWallet.accounts = { "Ethereum 1": registered };
    render(<SignedNameShield account={evmAccount} displayName="Ethereum 1" />);

    expect(screen.getByTestId("crypto-addresses-name-signed-shield")).toBeInTheDocument();
  });

  it("renders nothing when the name has no device registration", () => {
    render(<SignedNameShield account={evmAccount} displayName="Ethereum 1" />);

    expect(
      screen.queryByTestId("crypto-addresses-name-signed-shield"),
    ).not.toBeInTheDocument();
  });

  it("renders nothing when the registration belongs to a different account (chain mismatch)", () => {
    mockWallet.accounts = { "Ethereum 1": { ...registered, chainId: 137 } };
    render(<SignedNameShield account={evmAccount} displayName="Ethereum 1" />);

    expect(
      screen.queryByTestId("crypto-addresses-name-signed-shield"),
    ).not.toBeInTheDocument();
  });

  it("renders nothing when the registration belongs to a different derivation path", () => {
    mockWallet.accounts = {
      "Ethereum 1": { ...registered, derivationPath: "44'/60'/1'/0/0" },
    };
    render(<SignedNameShield account={evmAccount} displayName="Ethereum 1" />);

    expect(
      screen.queryByTestId("crypto-addresses-name-signed-shield"),
    ).not.toBeInTheDocument();
  });
});
