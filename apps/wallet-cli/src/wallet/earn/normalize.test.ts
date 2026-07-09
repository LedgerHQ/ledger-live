import { describe, expect, it } from "bun:test";
import type { DefiProduct, DefiTransactionData, SolanaValidatorWithApy } from "./api.types";
import {
  normalizeDefiProduct,
  normalizeDefiTransaction,
  normalizeSolanaValidator,
} from "./normalize";

describe("normalizeDefiProduct", () => {
  it("maps backend snake_case fields onto the stable camelCase shape", () => {
    const raw: DefiProduct = {
      id: "usdc-vault",
      provided_by: "Kiln",
      display_name: "Kiln USDC Vault",
      name: "kiln-usdc",
      chain: "eth",
      chain_id: 1,
      address: "0xaaaa",
      status: "active",
      vault_id: "kiln-usdc",
      vault: "0xbbbb",
      asset: "0xcccc",
      asset_symbol: "USDC",
      currency: "ethereum/erc20/usd__coin",
      asset_decimals: 6,
      nrr: 2.5,
      totalNrr: 5,
    };

    expect(normalizeDefiProduct(raw)).toEqual({
      id: "usdc-vault",
      providedBy: "Kiln",
      displayName: "Kiln USDC Vault",
      name: "kiln-usdc",
      chain: "eth",
      chainId: 1,
      address: "0xaaaa",
      status: "active",
      vaultId: "kiln-usdc",
      vault: "0xbbbb",
      asset: "0xcccc",
      assetSymbol: "USDC",
      currency: "ethereum/erc20/usd__coin",
      assetDecimals: 6,
      nrr: 2.5,
      totalNrr: 5,
    });
  });

  it("keeps backend-optional fields undefined (lazy validation stays with the caller)", () => {
    const normalized = normalizeDefiProduct({ id: "bare-vault" });
    expect(normalized.id).toBe("bare-vault");
    expect(normalized.vault).toBeUndefined();
    expect(normalized.assetDecimals).toBeUndefined();
    expect(normalized.chainId).toBeUndefined();
  });
});

describe("normalizeDefiTransaction", () => {
  it("camelCases the gas/chain fields of backend-built calldata", () => {
    const raw: DefiTransactionData = {
      wallet: "0x1111",
      to: "0xbbbb",
      data: "0x6e553f65",
      value: "0",
      nonce: 3,
      gas_limit: 1_200_000,
      chain_id: 1,
    };

    expect(normalizeDefiTransaction(raw)).toEqual({
      wallet: "0x1111",
      to: "0xbbbb",
      data: "0x6e553f65",
      value: "0",
      nonce: 3,
      gasLimit: 1_200_000,
      chainId: 1,
    });
  });
});

describe("normalizeSolanaValidator", () => {
  it("maps the validators-list row and coerces the nullable delinquent flag to a boolean", () => {
    const raw: SolanaValidatorWithApy = {
      vote_account: "voteAcc",
      name: "Ledger by Figment",
      commission: 7,
      total_score: 8,
      active_stake: 123,
      delinquent: false,
      apy: 0.078,
    };

    expect(normalizeSolanaValidator(raw)).toEqual({
      voteAccount: "voteAcc",
      name: "Ledger by Figment",
      commission: 7,
      score: 8,
      activeStake: 123,
      delinquent: false,
      apy: 0.078,
    });
  });

  it("normalizes null/missing nullable fields to undefined and delinquent to false", () => {
    const raw: SolanaValidatorWithApy = {
      vote_account: "voteAcc2",
      name: null,
      commission: null,
      total_score: null,
    };

    expect(normalizeSolanaValidator(raw)).toEqual({
      voteAccount: "voteAcc2",
      name: undefined,
      commission: undefined,
      score: undefined,
      activeStake: undefined,
      delinquent: false,
      apy: undefined,
    });
  });
});
