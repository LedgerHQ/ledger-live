import { describe, expect, it } from "bun:test";
import type { NormalizedDefiTransaction } from "./normalize";
import {
  assertEvmVaultTransactionSafety,
  assertTransactionWallet,
  assertVaultDepositable,
  isVaultDepositable,
} from "./eth-vault-policy";

const SIGNER = "0x1111111111111111111111111111111111111111";

// A backend-built calldata payload that passes every safety check, so each test can flip exactly one
// field to prove the matching assertion is what rejects it.
const SAFE_TX: NormalizedDefiTransaction = {
  wallet: SIGNER,
  to: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  data: "0x6e553f65",
  value: "0",
  nonce: 0,
  gasLimit: 1_200_000,
  chainId: 1,
};

describe("assertTransactionWallet", () => {
  it("accepts a wallet that matches the signing account", () => {
    expect(() => assertTransactionWallet({ wallet: SIGNER }, SIGNER, "deposit")).not.toThrow();
  });

  it("matches case-insensitively (EVM addresses are checksum-cased)", () => {
    expect(() =>
      assertTransactionWallet({ wallet: SIGNER.toUpperCase() }, SIGNER, "deposit"),
    ).not.toThrow();
  });

  it("throws when the backend wallet differs from the signing account", () => {
    expect(() =>
      assertTransactionWallet(
        { wallet: "0x2222222222222222222222222222222222222222" },
        SIGNER,
        "deposit",
      ),
    ).toThrow(/does not match the signing account address/);
  });
});

describe("assertEvmVaultTransactionSafety", () => {
  it("passes when wallet, target, value and chain id all line up", () => {
    expect(() =>
      assertEvmVaultTransactionSafety(SAFE_TX, SIGNER, SAFE_TX.to, SAFE_TX.chainId, "deposit"),
    ).not.toThrow();
  });

  it("refuses to sign when the backend calldata was built for a different wallet", () => {
    const foreignTx = { ...SAFE_TX, wallet: "0x2222222222222222222222222222222222222222" };
    expect(() =>
      assertEvmVaultTransactionSafety(foreignTx, SIGNER, SAFE_TX.to, SAFE_TX.chainId, "deposit"),
    ).toThrow(/does not match the signing account address/);
  });

  it("still enforces the target check", () => {
    expect(() =>
      assertEvmVaultTransactionSafety(SAFE_TX, SIGNER, "0xdead", SAFE_TX.chainId, "deposit"),
    ).toThrow(/does not match allowlisted target/);
  });
});

describe("isVaultDepositable", () => {
  it("treats a vault with no status as depositable", () => {
    expect(isVaultDepositable({})).toBe(true);
    expect(isVaultDepositable({ status: "" })).toBe(true);
    expect(isVaultDepositable({ status: "   " })).toBe(true);
  });

  it("treats an active/live status as depositable", () => {
    expect(isVaultDepositable({ status: "active" })).toBe(true);
    expect(isVaultDepositable({ status: "LIVE" })).toBe(true);
  });

  it.each(["disabled", "paused", "closed", "inactive", "deprecated"])(
    "treats %s as not depositable (case/space-insensitive)",
    status => {
      expect(isVaultDepositable({ status })).toBe(false);
      expect(isVaultDepositable({ status: `  ${status.toUpperCase()}  ` })).toBe(false);
    },
  );
});

describe("assertVaultDepositable", () => {
  it("does not throw for a depositable vault", () => {
    expect(() => assertVaultDepositable({ id: "usdc-vault", status: "active" })).not.toThrow();
    expect(() => assertVaultDepositable({ id: "usdc-vault" })).not.toThrow();
  });

  it("throws a clear error naming the vault and its blocking status", () => {
    expect(() => assertVaultDepositable({ id: "usdc-vault", status: "paused" })).toThrow(
      /vault usdc-vault is not currently depositable \(status: paused\)/,
    );
  });
});
