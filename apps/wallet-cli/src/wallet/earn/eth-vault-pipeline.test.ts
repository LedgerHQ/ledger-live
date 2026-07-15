import { describe, expect, it } from "bun:test";
import type { AccountDescriptor } from "../models";
import type { DefiProduct, DefiTransactionData } from "./api.types";
import {
  assertAccountMatchesProductChain,
  assertAmountTickerMatchesAsset,
  assertTransactionChainId,
  assertTransactionTarget,
  assertZeroNativeValue,
  parseAmountToBaseUnits,
  resolveDefiProduct,
  resolveTerminalTxStatus,
} from "./eth-vault-pipeline";
import { normalizeDefiProduct } from "./normalize";

const PRODUCT: DefiProduct = {
  id: "usdc-vault",
  chain: "eth",
  chain_id: 1,
  address: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  vault_id: "kiln-usdc",
  vault: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  asset: "0xcccccccccccccccccccccccccccccccccccccccc",
  asset_symbol: "USDC",
  currency: "ethereum/erc20/usd__coin",
  asset_decimals: 6,
};

// resolveDefiProduct still returns the RAW product (identity is asserted below); the rest of the
// pipeline consumes the normalized DTO, so the product-shaped helpers are exercised against it.
const NORMALIZED_PRODUCT = normalizeDefiProduct(PRODUCT);

const TRANSACTION: DefiTransactionData = {
  wallet: "0x1111111111111111111111111111111111111111",
  to: PRODUCT.vault ?? "",
  data: "0xabcdef",
  value: "0",
  nonce: 1,
  gas_limit: 50_000,
  chain_id: 1,
};

describe("resolveDefiProduct", () => {
  it("matches id, vault_id, address, and vault case-insensitively", () => {
    expect(resolveDefiProduct([PRODUCT], "USDC-VAULT")).toBe(PRODUCT);
    expect(resolveDefiProduct([PRODUCT], "KILN-USDC")).toBe(PRODUCT);
    expect(resolveDefiProduct([PRODUCT], "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")).toBe(
      PRODUCT,
    );
    expect(resolveDefiProduct([PRODUCT], "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB")).toBe(
      PRODUCT,
    );
  });

  it("throws for products outside the allowlist", () => {
    expect(() => resolveDefiProduct([PRODUCT], "unknown")).toThrow(/Unknown EVM earn product/);
  });
});

describe("parseAmountToBaseUnits", () => {
  it("converts human decimals to integer base units", () => {
    expect(parseAmountToBaseUnits("1", 6)).toBe("1000000");
    expect(parseAmountToBaseUnits("1.23 USDC", 6)).toBe("1230000");
    expect(parseAmountToBaseUnits("USDC 0.000001", 6)).toBe("1");
  });

  it("rejects over-precise and malformed amounts", () => {
    expect(() => parseAmountToBaseUnits("0.0000001", 6)).toThrow(/too many decimal places/);
    expect(() => parseAmountToBaseUnits("-1", 6)).toThrow(/Invalid amount/);
    expect(() => parseAmountToBaseUnits("1e3", 6)).toThrow(/Invalid amount/);
  });

  it("rejects zero amounts", () => {
    expect(() => parseAmountToBaseUnits("0", 6)).toThrow(/greater than zero/);
    expect(() => parseAmountToBaseUnits("0.0", 18)).toThrow(/greater than zero/);
  });
});

describe("assertTransactionTarget", () => {
  it("accepts matching targets case-insensitively", () => {
    expect(() =>
      assertTransactionTarget(TRANSACTION, "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB", "deposit"),
    ).not.toThrow();
  });

  it("rejects backend transactions targeting a non-allowlisted contract", () => {
    expect(() =>
      assertTransactionTarget(
        { ...TRANSACTION, to: "0xdddddddddddddddddddddddddddddddddddddddd" },
        PRODUCT.vault ?? "",
        "deposit",
      ),
    ).toThrow(/Refusing to sign deposit/);
  });
});

describe("assertZeroNativeValue", () => {
  it("accepts any zero encoding of the native value", () => {
    for (const value of ["0", "0x0", "0x00", "00", " 0 ", "0x", "0X", ""]) {
      expect(() => assertZeroNativeValue({ ...TRANSACTION, value }, "deposit")).not.toThrow();
    }
  });

  it("rejects a backend transaction carrying non-zero native value", () => {
    expect(() =>
      assertZeroNativeValue({ ...TRANSACTION, value: "1000000000000000000" }, "deposit"),
    ).toThrow(/non-zero native value/);
    expect(() => assertZeroNativeValue({ ...TRANSACTION, value: "0x1" }, "deposit")).toThrow(
      /non-zero native value/,
    );
  });

  it("fails safe and rejects an unparseable native value", () => {
    expect(() => assertZeroNativeValue({ ...TRANSACTION, value: "garbage" }, "deposit")).toThrow(
      /non-zero native value/,
    );
  });
});

describe("assertTransactionChainId", () => {
  it("accepts a transaction built for the expected chain id", () => {
    expect(() => assertTransactionChainId({ chainId: 1 }, 1, "deposit")).not.toThrow();
  });

  it("rejects a backend transaction built for a different chain id", () => {
    expect(() => assertTransactionChainId({ chainId: 137 }, 1, "deposit")).toThrow(
      /Refusing to sign deposit: backend transaction chain id 137/,
    );
  });
});

describe("assertAmountTickerMatchesAsset", () => {
  it("accepts a ticker that matches the vault asset (case-insensitive)", () => {
    expect(() => assertAmountTickerMatchesAsset("100 usdc", NORMALIZED_PRODUCT)).not.toThrow();
    expect(() => assertAmountTickerMatchesAsset("USDC 100", NORMALIZED_PRODUCT)).not.toThrow();
  });

  it("accepts a bare numeric amount (ticker is optional)", () => {
    expect(() => assertAmountTickerMatchesAsset("100", NORMALIZED_PRODUCT)).not.toThrow();
  });

  it("rejects a ticker that names a different asset", () => {
    expect(() => assertAmountTickerMatchesAsset("100 DAI", NORMALIZED_PRODUCT)).toThrow(
      /does not match the vault asset "USDC"/,
    );
  });

  it("skips validation when the product has no asset_symbol", () => {
    const noSymbol: DefiProduct = { ...PRODUCT, asset_symbol: undefined };
    expect(() =>
      assertAmountTickerMatchesAsset("100 DAI", normalizeDefiProduct(noSymbol)),
    ).not.toThrow();
  });
});

describe("assertAccountMatchesProductChain", () => {
  const descriptorFor = (currencyId: string): AccountDescriptor =>
    ({ id: `acc-${currencyId}`, currencyId }) as unknown as AccountDescriptor;

  it("accepts an account on the vault's chain (ethereum mainnet == chain_id 1)", () => {
    expect(() =>
      assertAccountMatchesProductChain(descriptorFor("ethereum"), NORMALIZED_PRODUCT),
    ).not.toThrow();
  });

  it("rejects an EVM account on a different chain (polygon == chain_id 137)", () => {
    expect(() =>
      assertAccountMatchesProductChain(descriptorFor("polygon"), NORMALIZED_PRODUCT),
    ).toThrow(/is on chain id 137 but vault usdc-vault is on chain id 1/);
  });

  it("rejects a non-EVM account currency", () => {
    expect(() =>
      assertAccountMatchesProductChain(descriptorFor("solana"), NORMALIZED_PRODUCT),
    ).toThrow(/is not an EVM chain/);
  });
});

describe("resolveTerminalTxStatus", () => {
  it("returns 'success' for a confirmed transaction", () => {
    expect(resolveTerminalTxStatus("success", { hash: "0xabc", label: "Deposit" })).toBe("success");
  });

  it("throws on a reverted (error) transaction so the command fails loudly", () => {
    expect(() => resolveTerminalTxStatus("error", { hash: "0xabc", label: "Deposit" })).toThrow(
      /Deposit transaction 0xabc reverted on-chain/,
    );
  });

  it("maps a timed-out poll (pending_confirmation / unknown) to a non-success 'pending'", () => {
    expect(
      resolveTerminalTxStatus("pending_confirmation", { hash: "0xabc", label: "Redeem" }),
    ).toBe("pending");
    expect(resolveTerminalTxStatus("unknown", { hash: "0xabc", label: "Redeem" })).toBe("pending");
  });
});
