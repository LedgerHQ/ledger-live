import type { Balance, TransactionIntent } from "@ledgerhq/coin-module-framework/api/types";
import {
  AmountRequired,
  FeeTooHigh,
  InvalidAddress,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/ledger-wallet-framework/errors";
import { DustLimit, FeeTooLow, InvalidUtxoId, InvalidUtxoStrategy } from "../../errors";
import { validateIntent } from "../validateIntent";
import { FUNDED_P2WPKH, PRISTINE_P2PKH, PRISTINE_P2TR } from "./helpers/fixtures";
import { testContext, useMswServer } from "./helpers/msw";

// No handler is registered: any request would fail the test.
useMswServer();

const BALANCES: Balance[] = [{ value: 10_000n, asset: { type: "native" } }];

const intent = (overrides: Partial<TransactionIntent> = {}): TransactionIntent => ({
  intentType: "transaction",
  type: "send",
  sender: FUNDED_P2WPKH,
  recipient: PRISTINE_P2PKH,
  amount: 1_000n,
  asset: { type: "native" },
  ...overrides,
});

const withControl = (utxoStrategy: Record<string, unknown>) =>
  intent({ data: { type: "string", utxoStrategy } } as Partial<TransactionIntent>);

describe("validateIntent", () => {
  it("accepts a valid intent and reports the amounts", async () => {
    expect(await validateIntent(testContext(), "bitcoin", intent(), BALANCES)).toEqual({
      errors: {},
      warnings: {},
      estimatedFees: 0n,
      amount: 1_000n,
      totalSpent: 1_000n,
    });
  });

  it("adds the custom fees to the total spent", async () => {
    const result = await validateIntent(testContext(), "bitcoin", intent(), BALANCES, {
      value: 50n,
    });
    expect(result.estimatedFees).toBe(50n);
    expect(result.totalSpent).toBe(1_050n);
    expect(result.errors).toEqual({});
    expect(result.warnings).toEqual({});
  });

  it("reports a missing recipient", async () => {
    const { errors } = await validateIntent(
      testContext(),
      "bitcoin",
      intent({ recipient: "" }),
      BALANCES,
    );
    expect(errors.recipient).toBeInstanceOf(RecipientRequired);
  });

  it("reports an invalid recipient", async () => {
    const { errors } = await validateIntent(
      testContext(),
      "bitcoin",
      intent({ recipient: "nope" }),
      BALANCES,
    );
    expect(errors.recipient).toBeInstanceOf(InvalidAddress);
  });

  it("names the currency in the invalid-recipient error with its display name from the config", async () => {
    const { errors } = await validateIntent(
      testContext({ name: "Litecoin" }),
      "litecoin",
      intent({ recipient: "nope" }),
      BALANCES,
    );
    expect(errors.recipient).toMatchObject({ currencyName: "Litecoin" });
  });

  it("rejects a litecoin address on a bitcoin instance", async () => {
    const { errors } = await validateIntent(
      testContext(),
      "bitcoin",
      intent({ recipient: "ltc1qx2wxzwmpg4m8tr9d7rharerxaqj50jkdasvxmx" }),
      BALANCES,
    );
    expect(errors.recipient).toBeInstanceOf(InvalidAddress);
  });

  it("rejects a bitcoin address on a litecoin instance", async () => {
    const { errors } = await validateIntent(
      testContext(),
      "litecoin",
      intent({ recipient: FUNDED_P2WPKH }),
      BALANCES,
    );
    expect(errors.recipient).toBeInstanceOf(InvalidAddress);
  });

  it("accepts a Taproot recipient on bitcoin", async () => {
    const { errors } = await validateIntent(
      testContext(),
      "bitcoin",
      intent({ recipient: PRISTINE_P2TR }),
      BALANCES,
    );
    expect(errors).toEqual({});
  });

  it("accepts a cashaddr recipient on bitcoin_cash", async () => {
    const { errors } = await validateIntent(
      testContext(),
      "bitcoin_cash",
      intent({ recipient: "bitcoincash:qp3wjpa3tjlj042z2wv7hahsldgwhwy0rq9sywjpyy" }),
      BALANCES,
    );
    expect(errors).toEqual({});
  });

  it.each([0n, -1n])("reports AmountRequired for an amount of %s", async amount => {
    const { errors } = await validateIntent(testContext(), "bitcoin", intent({ amount }), BALANCES);
    expect(errors.amount).toBeInstanceOf(AmountRequired);
  });

  it("reports NotEnoughBalance when the amount exceeds the balance", async () => {
    const { errors } = await validateIntent(
      testContext(),
      "bitcoin",
      intent({ amount: 10_001n }),
      BALANCES,
    );
    expect(errors.amount).toBeInstanceOf(NotEnoughBalance);
  });

  it("reports NotEnoughBalance when the amount plus custom fees exceeds the balance", async () => {
    const { errors } = await validateIntent(
      testContext(),
      "bitcoin",
      intent({ amount: 9_000n }),
      BALANCES,
      {
        value: 1_001n,
      },
    );
    expect(errors.amount).toBeInstanceOf(NotEnoughBalance);
  });

  it("reports NotEnoughBalance when no native balance is given", async () => {
    const { errors } = await validateIntent(testContext(), "bitcoin", intent(), [
      { value: 10_000n, asset: { type: "token", assetReference: "x" } },
    ]);
    expect(errors.amount).toBeInstanceOf(NotEnoughBalance);
  });

  it("warns FeeTooHigh when custom fees exceed 10% of the amount", async () => {
    const { warnings, errors } = await validateIntent(
      testContext(),
      "bitcoin",
      intent(),
      BALANCES,
      {
        value: 101n,
      },
    );
    expect(warnings.feeTooHigh).toBeInstanceOf(FeeTooHigh);
    expect(errors).toEqual({});
  });

  it("does not warn at exactly 10% of the amount", async () => {
    const { warnings } = await validateIntent(testContext(), "bitcoin", intent(), BALANCES, {
      value: 100n,
    });
    expect(warnings).toEqual({});
  });

  it("sends the balance minus the custom fees for useAllAmount", async () => {
    const result = await validateIntent(
      testContext(),
      "bitcoin",
      intent({ useAllAmount: true, amount: 0n }),
      BALANCES,
      { value: 300n },
    );
    expect(result).toEqual({
      errors: {},
      warnings: {},
      estimatedFees: 300n,
      amount: 9_700n,
      totalSpent: 10_000n,
    });
  });

  it("sends the sweep amount the estimate priced for useAllAmount, even above the confirmed balance", async () => {
    // The estimate also spends outputs created by unconfirmed transactions.
    const result = await validateIntent(
      testContext(),
      "bitcoin",
      intent({ useAllAmount: true }),
      BALANCES,
      {
        value: 300n,
        parameters: { amount: 12_000n },
      },
    );
    expect(result.amount).toBe(12_000n);
    expect(result.errors).toEqual({});
  });

  it("reads the sweep amount Ledger Live hands back JSON-safe, as a decimal string", async () => {
    const result = await validateIntent(
      testContext(),
      "bitcoin",
      intent({ useAllAmount: true }),
      BALANCES,
      {
        value: 300n,
        parameters: { amount: "12000" },
      },
    );
    expect(result.amount).toBe(12_000n);
    expect(result.errors).toEqual({});
  });

  it("reports a negative custom fee, which would otherwise lower the funds needed", async () => {
    const result = await validateIntent(
      testContext(),
      "bitcoin",
      intent({ amount: 10_000n }),
      BALANCES,
      {
        value: -1_000n,
      },
    );
    expect(result.errors.fees?.message).toBe("customFees.value must not be negative");
  });

  describe("against the relay minimum the estimate returned", () => {
    const relay = { relayFeePerByte: 5n, vsize: 141n };

    it("reports a fee below the relay fee for the transaction's size", async () => {
      const result = await validateIntent(testContext(), "bitcoin", intent(), BALANCES, {
        value: 141n * 5n - 1n,
        parameters: relay,
      });
      expect(result.errors.fees).toBeInstanceOf(FeeTooLow);
    });

    it("reports a rate below the relay rate", async () => {
      const result = await validateIntent(testContext(), "bitcoin", intent(), BALANCES, {
        value: 0n,
        parameters: { ...relay, feesStrategy: "custom", feePerByte: 2n },
      });
      expect(result.errors.fees).toBeInstanceOf(FeeTooLow);
    });

    it("accepts the relay minimum, also as the JSON-safe strings Ledger Live hands back", async () => {
      const result = await validateIntent(testContext(), "bitcoin", intent(), BALANCES, {
        value: 141n * 5n,
        parameters: { relayFeePerByte: "5", vsize: "141", feePerByte: "5" },
      });
      expect(result.errors.fees).toBeUndefined();
    });

    it("reports nothing without the estimate's parameters", async () => {
      const result = await validateIntent(testContext(), "bitcoin", intent(), BALANCES, {
        value: 1n,
      });
      expect(result.errors.fees).toBeUndefined();
    });
  });

  it("reports an amount below the dust threshold of the payment", async () => {
    const result = await validateIntent(
      testContext(),
      "bitcoin",
      intent({ amount: 100n }),
      BALANCES,
    );
    expect(result.errors.amount).toBeInstanceOf(DustLimit);
  });

  it("sends the whole balance for useAllAmount without fees", async () => {
    const result = await validateIntent(
      testContext(),
      "bitcoin",
      intent({ useAllAmount: true }),
      BALANCES,
    );
    expect(result.amount).toBe(10_000n);
    expect(result.errors).toEqual({});
  });

  it("reports NotEnoughBalance for useAllAmount when the fees exceed the balance", async () => {
    const result = await validateIntent(
      testContext(),
      "bitcoin",
      intent({ useAllAmount: true }),
      BALANCES,
      {
        value: 10_000n,
      },
    );
    expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
    expect(result.amount).toBe(0n);
  });

  describe("with the estimate's verdict on funds", () => {
    // The estimate selects from what crafting spends, own unconfirmed change included, which the
    // confirmed balance passed in does not show.
    it("accepts a send the estimate covers, though the confirmed balance does not", async () => {
      const result = await validateIntent(
        testContext(),
        "bitcoin",
        intent({ amount: 50_000n }),
        BALANCES,
        {
          value: 200n,
          parameters: { sufficient: true },
        },
      );
      expect(result.errors).toEqual({});
    });

    it("refuses a send the estimate does not cover, though the confirmed balance does", async () => {
      const result = await validateIntent(
        testContext(),
        "bitcoin",
        intent({ amount: 5_000n }),
        BALANCES,
        {
          value: 200n,
          parameters: { sufficient: false },
        },
      );
      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });
  });

  describe("with a coin control", () => {
    const HASH = "ab".repeat(32);

    it("adds no error for a well formed one", async () => {
      const result = await validateIntent(
        testContext(),
        "bitcoin",
        withControl({
          strategy: "optimize-size",
          selectedUtxos: [`${HASH}:0`],
          excludedUtxos: [`${HASH}:1`],
        }),
        BALANCES,
      );
      expect(result.errors).toEqual({});
    });

    it("reports a malformed UTXO id under coinControl", async () => {
      const result = await validateIntent(
        testContext(),
        "bitcoin",
        withControl({ selectedUtxos: ["not-an-id"] }),
        BALANCES,
      );
      expect(result.errors.coinControl).toBeInstanceOf(InvalidUtxoId);
    });

    it("reports an id both selected and excluded", async () => {
      const result = await validateIntent(
        testContext(),
        "bitcoin",
        withControl({ selectedUtxos: [`${HASH}:0`], excludedUtxos: [`${HASH}:0`] }),
        BALANCES,
      );
      expect(result.errors.coinControl).toBeInstanceOf(InvalidUtxoId);
    });

    it("reports an id listed twice under coinControl", async () => {
      const result = await validateIntent(
        testContext(),
        "bitcoin",
        withControl({ selectedUtxos: [`${HASH}:0`, `${HASH}:0`] }),
        BALANCES,
      );
      expect(result.errors.coinControl).toBeInstanceOf(InvalidUtxoId);
    });

    it("reports an unknown strategy under coinControl", async () => {
      const result = await validateIntent(
        testContext(),
        "bitcoin",
        withControl({ strategy: "random" }),
        BALANCES,
      );
      expect(result.errors.coinControl).toBeInstanceOf(InvalidUtxoStrategy);
    });

    it("reports NotEnoughBalance when the estimate says the selection does not cover the send", async () => {
      const result = await validateIntent(
        testContext(),
        "bitcoin",
        withControl({ selectedUtxos: [`${HASH}:0`] }),
        BALANCES,
        { value: 200n, parameters: { sufficient: false } },
      );
      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
      expect(result.errors.coinControl).toBeUndefined();
    });
  });
});
