import type {
  Balance,
  StringMemo,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { fetchNetworkInfo } from "../api/getNetworkInfo";
import { validateIntent } from "./validateIntent";

// Stub the network fetch validateIntent uses for the min-UTXO floor (keeps these tests offline).
jest.mock("../api/getNetworkInfo", () => ({
  fetchNetworkInfo: jest.fn().mockResolvedValue({ protocolParams: { utxoCostPerByte: "4310" } }),
}));

const currency = getCryptoCurrencyById("cardano");
const SENDER =
  "addr1q8mgw8geggkl2hs0m6rq3pgt69uxttpqcgu6euxje5tt6plxjtjrnskhhtt03g6l3sr98p9t8mtlajr26vmwjzep77pqxn8cms";
const RECIPIENT =
  "addr1qxqm3nxwzf70ke9jqa2zrtrevjznpv6yykptxnv34perjc8a7zgxmpv5pgk4hhhe0m9kfnlsf5pt7d2ahkxaul2zygrq3nura9";

const balances = (value: bigint, locked = 0n): Balance[] => [
  { asset: { type: "native" }, value, locked },
];

const TOKEN_REF = "1234567890123456789012345678901234567890123456789012345a.4d59544f4b454e";
const tokenAsset = { type: "token", assetReference: TOKEN_REF, assetOwner: SENDER } as const;

const tokenBalances = (tokenValue: bigint, nativeValue = 10_000_000n): Balance[] => [
  { asset: { type: "native" }, value: nativeValue },
  { asset: tokenAsset, value: tokenValue },
];

function intent(over: Partial<TransactionIntent<StringMemo>> = {}): TransactionIntent<StringMemo> {
  return {
    intentType: "transaction",
    type: "send",
    sender: SENDER,
    recipient: RECIPIENT,
    amount: 2_000_000n,
    asset: { type: "native" },
    ...over,
  } as TransactionIntent<StringMemo>;
}

describe("validateIntent", () => {
  it("validates a fundable native transfer and computes amount + totalSpent", async () => {
    const res = await validateIntent(currency, intent(), balances(10_000_000n), {
      value: 1_000_000n,
    });

    expect(res.errors).toEqual({});
    expect(res.estimatedFees).toBe(1_000_000n);
    expect(res.amount).toBe(2_000_000n);
    expect(res.totalSpent).toBe(3_000_000n);
  });

  it.each([
    ["", "RecipientRequired"],
    ["not-an-address", "InvalidAddress"],
  ])("flags recipient %p", async (recipient, name) => {
    const res = await validateIntent(currency, intent({ recipient }), balances(10_000_000n));
    expect(res.errors.recipient?.name).toBe(name);
  });

  it("allows a self-send (sender === recipient)", async () => {
    const res = await validateIntent(
      currency,
      intent({ recipient: SENDER }),
      balances(10_000_000n),
      {
        value: 200_000n,
      },
    );
    expect(res.errors.recipient).toBeUndefined();
  });

  it("flags a zero amount", async () => {
    const res = await validateIntent(currency, intent({ amount: 0n }), balances(10_000_000n));
    expect(res.errors.amount?.name).toBe("AmountRequired");
  });

  it("flags amount + fees exceeding the spendable balance", async () => {
    const res = await validateIntent(
      currency,
      intent({ amount: 10_000_000n }),
      balances(10_000_000n),
      {
        value: 1_000_000n,
      },
    );
    expect(res.errors.amount?.name).toBe("NotEnoughBalance");
  });

  it("computes max spendable for useAllAmount (balance − fees)", async () => {
    const res = await validateIntent(
      currency,
      intent({ useAllAmount: true, amount: 0n }),
      balances(10_000_000n),
      { value: 1_000_000n },
    );
    expect(res.errors).toEqual({});
    expect(res.amount).toBe(9_000_000n);
    expect(res.totalSpent).toBe(10_000_000n);
  });

  it("validates a token transfer against the token balance, with fees excluded from totalSpent", async () => {
    const res = await validateIntent(
      currency,
      intent({ asset: tokenAsset, amount: 500n }),
      tokenBalances(1_000n),
      { value: 1_000_000n },
    );
    expect(res.errors).toEqual({});
    // The ADA fee must not be compared against the token amount (different units) — no feeTooHigh.
    expect(res.warnings).toEqual({});
    expect(res.amount).toBe(500n);
    expect(res.totalSpent).toBe(500n);
  });

  it("flags a token transfer the native balance cannot cover the fee for", async () => {
    const res = await validateIntent(
      currency,
      intent({ asset: tokenAsset, amount: 500n }),
      tokenBalances(1_000n, 0n),
      { value: 1_000_000n },
    );
    expect(res.errors.amount?.name).toBe("NotEnoughBalance");
  });

  it("flags a token transfer exceeding the token balance (not the native balance)", async () => {
    const res = await validateIntent(
      currency,
      intent({ asset: tokenAsset, amount: 2_000n }),
      tokenBalances(1_000n),
      { value: 1_000_000n },
    );
    expect(res.errors.amount?.name).toBe("NotEnoughBalance");
  });

  it('treats an asset carrying an assetReference as a token even when its type is "native"', async () => {
    // CAL types Cardano native tokens as tokenType "native", so the generic-coin-framework adapter
    // hands validateIntent a token intent (and balances) with asset.type "native" + assetReference.
    const nativeTypedToken = {
      type: "native",
      assetReference: TOKEN_REF,
      assetOwner: SENDER,
    } as const;
    const balances: Balance[] = [
      { asset: { type: "native" }, value: 10_000_000n },
      { asset: nativeTypedToken, value: 1_000n },
    ];
    const res = await validateIntent(
      currency,
      intent({ asset: nativeTypedToken, amount: 500n }),
      balances,
      { value: 1_000_000n },
    );
    expect(res.errors).toEqual({});
    // Token amount is spent in the token; fees are excluded from totalSpent (token path).
    expect(res.amount).toBe(500n);
    expect(res.totalSpent).toBe(500n);
  });

  it("computes max spendable for a useAllAmount token transfer (full token balance)", async () => {
    const res = await validateIntent(
      currency,
      intent({ asset: tokenAsset, useAllAmount: true, amount: 0n }),
      tokenBalances(1_000n),
      { value: 1_000_000n },
    );
    expect(res.errors).toEqual({});
    expect(res.amount).toBe(1_000n);
    expect(res.totalSpent).toBe(1_000n);
  });

  it("warns feeTooHigh on a native transfer whose fee exceeds 10% of the amount", async () => {
    const res = await validateIntent(
      currency,
      intent({ amount: 5_000_000n }),
      balances(10_000_000n),
      {
        value: 1_000_000n,
      },
    );
    expect(res.errors).toEqual({});
    expect(res.warnings.feeTooHigh?.name).toBe("FeeTooHigh");
  });

  it("flags a native amount below the min-UTXO floor", async () => {
    const res = await validateIntent(
      currency,
      intent({ amount: 100_000n }),
      balances(10_000_000n),
      {
        value: 200_000n,
      },
    );
    expect(res.errors.amount?.name).toBe("CardanoMinAmountError");
  });

  it("stays resilient when network info is unavailable (skips the min-UTXO pre-check)", async () => {
    (fetchNetworkInfo as jest.Mock).mockRejectedValueOnce(new Error("network down"));
    // Below the floor, but the params fetch failed → skip the best-effort check (craft still enforces it).
    const res = await validateIntent(
      currency,
      intent({ amount: 100_000n }),
      balances(10_000_000n),
      {
        value: 200_000n,
      },
    );
    expect(res.errors.amount).toBeUndefined();
  });

  it("flags a memo longer than the Cardano metadata limit", async () => {
    const res = await validateIntent(
      currency,
      intent({ memo: { type: "string", kind: "text", value: "a".repeat(65) } }),
      balances(10_000_000n),
    );
    expect(res.errors.transaction?.name).toBe("CardanoMemoExceededSizeError");
  });

  describe("staking", () => {
    const POOL_HASH = "1".repeat(56);

    function stakeIntent(
      over: Partial<TransactionIntent<StringMemo>> = {},
    ): TransactionIntent<StringMemo> {
      return intent({
        intentType: "staking",
        type: "stake",
        mode: "delegate",
        valAddress: POOL_HASH,
        recipient: "",
        amount: 0n,
        ...over,
      } as Partial<TransactionIntent<StringMemo>>);
    }

    it("validates a fundable delegation (no ADA moved, only fees)", async () => {
      const res = await validateIntent(currency, stakeIntent(), balances(10_000_000n), {
        value: 200_000n,
      });
      expect(res.errors).toEqual({});
      expect(res.amount).toBe(0n);
      expect(res.estimatedFees).toBe(200_000n);
      expect(res.totalSpent).toBe(200_000n);
    });

    it("does not run the native recipient check for a delegation (empty recipient is fine)", async () => {
      const res = await validateIntent(
        currency,
        stakeIntent({ recipient: "" }),
        balances(10_000_000n),
        {
          value: 200_000n,
        },
      );
      expect(res.errors.recipient).toBeUndefined();
    });

    it("flags a delegation missing its pool id", async () => {
      const res = await validateIntent(
        currency,
        stakeIntent({ valAddress: "" } as Partial<TransactionIntent<StringMemo>>),
        balances(10_000_000n),
        {
          value: 200_000n,
        },
      );
      expect(res.errors.valAddress?.name).toBe("ValAddressRequired");
    });

    it("flags a delegation whose fee the balance cannot cover", async () => {
      const res = await validateIntent(currency, stakeIntent(), balances(100_000n), {
        value: 200_000n,
      });
      expect(res.errors.amount?.name).toBe("NotEnoughBalance");
    });

    it("validates an undelegation without requiring a pool id", async () => {
      const res = await validateIntent(
        currency,
        stakeIntent({ mode: "undelegate", valAddress: "" } as Partial<
          TransactionIntent<StringMemo>
        >),
        balances(10_000_000n),
        { value: 200_000n },
      );
      expect(res.errors).toEqual({});
      expect(res.totalSpent).toBe(200_000n);
    });

    it("flags an oversized memo on a delegation (craft applies it for staking too)", async () => {
      const res = await validateIntent(
        currency,
        stakeIntent({ memo: { type: "string", kind: "text", value: "a".repeat(65) } }),
        balances(10_000_000n),
        { value: 200_000n },
      );
      expect(res.errors.transaction?.name).toBe("CardanoMemoExceededSizeError");
    });
  });
});
