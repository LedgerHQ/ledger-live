import { describe, expect, it } from "bun:test";
import { getWalletApiIdFromAccountId } from "@ledgerhq/live-common/wallet-api/converters";
import type { DefiProduct } from "./api.types";
import type { NormalizedSolanaValidator } from "./normalize";
import {
  depositWalletAccountId,
  selectStakeValidators,
  solanaStakeDeeplink,
  validatorToRow,
  vaultToRow,
} from "./yields";

// Parent account id (js:2:…) for the first discovered ethereum account; the wallet-API ids below are
// the real ones Ledger Live reports for this account and its token sub-accounts (verified against an
// app account.list response), so these pins guard the token-account resolution against regressions.
const PARENT_ETH = "js:2:ethereum:0x0b6d51060f37487761b471144F2d00393b5908b5:";

describe("depositWalletAccountId", () => {
  it("returns the parent account's wallet-API id for a native deposit_token", () => {
    expect(depositWalletAccountId(PARENT_ETH, "ethereum")).toBe(
      getWalletApiIdFromAccountId(PARENT_ETH),
    );
  });

  it("resolves the token sub-account id for a token deposit_token (USDC, not the parent)", () => {
    expect(depositWalletAccountId(PARENT_ETH, "ethereum/erc20/usd__coin")).toBe(
      "1a54acf9-08a1-5d1f-8ea5-494bcd3b0d8b",
    );
  });

  it("resolves a different token sub-account id for USDT", () => {
    expect(depositWalletAccountId(PARENT_ETH, "ethereum/erc20/usd_tether__erc20_")).toBe(
      "45fcd28a-fdb0-58dd-b69f-9d6685184fb4",
    );
  });

  it("returns undefined when no parent account is known for the network", () => {
    expect(depositWalletAccountId(undefined, "ethereum/erc20/usd__coin")).toBeUndefined();
  });
});

describe("solanaStakeDeeplink", () => {
  it("opens the native stake-account modal for a known wallet account", () => {
    expect(solanaStakeDeeplink("49a5965b-1234-5678-9abc-def012345678")).toBe(
      "ledgerlive://earn?action=stake-account&accountId=49a5965b-1234-5678-9abc-def012345678",
    );
  });

  it("falls back to the generic stake flow when no account is known", () => {
    expect(solanaStakeDeeplink(undefined)).toBe("ledgerlive://earn?action=stake");
  });
});

const validator = (over: Partial<NormalizedSolanaValidator>): NormalizedSolanaValidator => ({
  voteAccount: "vote",
  delinquent: false,
  ...over,
});

describe("selectStakeValidators", () => {
  it("puts Ledger-operated validators first, then others by descending score", () => {
    const result = selectStakeValidators(
      [
        validator({ voteAccount: "other-low", name: "Kiln", score: 3 }),
        validator({ voteAccount: "ledger-low", name: "Ledger by Bitwise", score: 5 }),
        validator({ voteAccount: "other-high", name: "P2P", score: 9 }),
        validator({ voteAccount: "ledger-high", name: "Ledger by Figment", score: 8 }),
      ],
      10,
    );
    expect(result.map(v => v.voteAccount)).toEqual([
      "ledger-high",
      "ledger-low",
      "other-high",
      "other-low",
    ]);
  });

  it("drops delinquent validators and applies the limit", () => {
    const result = selectStakeValidators(
      [
        validator({ voteAccount: "a", score: 9 }),
        validator({ voteAccount: "delinquent", score: 10, delinquent: true }),
        validator({ voteAccount: "b", score: 8 }),
        validator({ voteAccount: "c", score: 7 }),
      ],
      2,
    );
    expect(result.map(v => v.voteAccount)).toEqual(["a", "b"]);
  });
});

describe("vaultToRow", () => {
  const vault = (over: Partial<DefiProduct>): DefiProduct => ({ id: "vault-1", ...over });

  it("prefers totalNrr over nrr and converts the percentage to a decimal-string rate", () => {
    const row = vaultToRow(vault({ totalNrr: 5, nrr: 2.5, asset_symbol: "USDC" }), "ethereum");
    expect(row.interestValue).toBe("0.05");
    expect(row.vaultId).toBe("vault-1");
    expect(row.depositable).toBe(true);
  });

  it("falls back to nrr when totalNrr is absent", () => {
    expect(vaultToRow(vault({ nrr: 2.5 }), "ethereum").interestValue).toBe("0.025");
  });

  it("leaves the rate empty when neither nrr nor totalNrr is present", () => {
    expect(vaultToRow(vault({}), "ethereum").interestValue).toBe("");
  });
});

describe("validatorToRow", () => {
  it("uses the Figment apy fraction directly as the rate and keeps commission", () => {
    const row = validatorToRow(
      validator({ voteAccount: "vote-1", name: "Ledger by Figment", apy: 0.078, commission: 7 }),
      "solana",
    );
    expect(row.interestValue).toBe("0.078");
    expect(row.validator).toBe("vote-1");
    expect(row.commission).toBe(7);
    expect(row.depositable).toBe(true);
  });

  it("leaves the rate empty when no apy was merged in", () => {
    const row = validatorToRow(validator({ voteAccount: "vote-2", apy: undefined }), "solana");
    expect(row.interestValue).toBe("");
    expect(row.provider).toBe("Solana validator");
  });
});
