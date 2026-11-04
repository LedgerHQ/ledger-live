import BigNumber from "bignumber.js";
import type { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import { QuotesErrorCodes } from "@ledgerhq/wallet-api-exchange-module";
import { getDepositSpendableBalance } from "./coinErrors";
import {
  getDepositBaseError,
  resolveDepositFormError,
  type ResolveDepositFormErrorParams,
} from "./formError";
import type { PerpsDepositQuote } from "./quote";

const MAGNITUDES: Record<string, number> = { assethub_polkadot: 10, stellar: 7 };

function currency(id: string, ticker: string) {
  const magnitude = MAGNITUDES[id] ?? 6;
  return {
    type: "CryptoCurrency",
    id,
    family: id,
    ticker,
    units: [{ name: ticker, code: ticker, magnitude }],
  };
}

function account(currencyId: string, spendableBalance: string, extra: object = {}): Account {
  return {
    type: "Account",
    id: `js:2:${currencyId}:0xfunding:`,
    currency: currency(currencyId, currencyId.toUpperCase()),
    spendableBalance: new BigNumber(spendableBalance),
    ...extra,
  } as unknown as Account;
}

function token(parent: Account, extra: object = {}): TokenAccount {
  return {
    type: "TokenAccount",
    id: `${parent.id}+token`,
    parentId: parent.id,
    token: {
      type: "TokenCurrency",
      id: `${parent.currency.id}/token`,
      ticker: "TKN",
      parentCurrencyId: parent.currency.id,
      units: [{ name: "TKN", code: "TKN", magnitude: 6 }],
    },
    spendableBalance: new BigNumber(1000),
    ...extra,
  } as unknown as TokenAccount;
}

const notReady = { readiness: { ready: false } };

function quoteWithFee(fee?: string): PerpsDepositQuote {
  return {
    amountTo: new BigNumber(1),
    errors: [],
    ...(fee && { estimatedNetworkFee: { amount: fee, currencyId: "any" } }),
  };
}

function resolve(
  depositAccount: AccountLike,
  overrides: Partial<ResolveDepositFormErrorParams> = {},
) {
  return resolveDepositFormError({
    isOffline: false,
    baseError: null,
    depositAccount,
    parentAccount: undefined,
    depositAmount: 20,
    sentAmountAtomic: new BigNumber(100),
    quoteResult: { quote: quoteWithFee("1"), errors: [] },
    locale: "en",
    ...overrides,
  });
}

describe("coin errors in the deposit resolver", () => {
  describe("account state, before the balance and the quote", () => {
    it.each([
      ["an unlinked SEI EVM account", account("sei_evm", "1000", notReady), "seiEvmUnlinked"],
      ["an unrevealed Tezos account", account("tezos", "1000", notReady), "tezosUnrevealed"],
    ])("reports %s with its support article", (_case, depositAccount, code) => {
      const error = resolve(depositAccount, {
        baseError: { code: "insufficientBalance", labelKey: "x" },
        quoteResult: { errors: [{ code: QuotesErrorCodes.NO_QUOTES }] },
      });

      expect(error?.code).toBe(code);
      expect(error?.supportUrl).toMatch(/^https:\/\/support\.ledger\.com\//);
    });

    it.each([
      ["a SEI EVM token whose parent is not linked", "sei_evm", "seiEvmUnlinked"],
      ["a Tezos token whose parent is not revealed", "tezos", "tezosUnrevealed"],
    ])("reports %s", (_case, currencyId, code) => {
      const parentAccount = account(currencyId, "1000", notReady);
      expect(resolve(token(parentAccount), { parentAccount })?.code).toBe(code);
    });

    it("blocks the quote request of a blocked account in the base check", () => {
      expect(
        getDepositBaseError({
          depositAccount: account("tezos", "1000", notReady),
          depositAmount: 20,
          maxAmount: 50,
          hasConversion: true,
        })?.code,
      ).toBe("tezosUnrevealed");
    });

    it("treats a missing readiness as ready", () => {
      expect(resolve(account("tezos", "1000"))).toBeNull();
    });

    it("waits for a positive amount", () => {
      expect(resolve(account("tezos", "1000", notReady), { depositAmount: 0 })).toBeNull();
    });
  });

  describe("aleo", () => {
    const aleo = (transparentBalance: string, privateBalance: string | null) =>
      account("aleo", "999", {
        aleoResources: {
          transparentBalance: new BigNumber(transparentBalance),
          privateBalance: privateBalance === null ? null : new BigNumber(privateBalance),
        },
      });

    it("reports private-only funds with the ticker", () => {
      expect(resolve(aleo("0", "500"))).toMatchObject({
        code: "aleoPrivateBalance",
        values: { ticker: "ALEO" },
        supportUrl: "https://support.ledger.com/article/Aleo-ALEO",
      });
    });

    it("uses only the public balance of the parent to pay the fees of a token", () => {
      const parentAccount = aleo("0", "500");
      const aleoToken = token(parentAccount, {
        transparentBalance: new BigNumber(10),
        privateBalance: null,
      });
      expect(resolve(aleoToken, { parentAccount })).toMatchObject({
        code: "notEnoughFees",
        labelKey: "perpsDeposit.formErrors.feeAccountEmpty",
      });
    });

    it("reports a private-only token", () => {
      const parentAccount = aleo("10", null);
      const aleoToken = token(parentAccount, {
        transparentBalance: new BigNumber(0),
        privateBalance: new BigNumber(5),
      });
      expect(resolve(aleoToken, { parentAccount })?.code).toBe("aleoPrivateBalance");
    });

    it.each([
      ["public and private funds", aleo("10", "500")],
      ["only staked funds", aleo("0", "0")],
      ["no private balance synced", aleo("0", null)],
    ])("accepts an account with %s", (_case, depositAccount) => {
      expect(resolve(depositAccount)?.code).not.toBe("aleoPrivateBalance");
    });

    it("uses the public balance as the deposit balance", () => {
      expect(getDepositSpendableBalance(aleo("10", "500")).toFixed()).toBe("10");
      expect(getDepositSpendableBalance(account("tezos", "42")).toFixed()).toBe("42");
    });
  });

  describe("minimum remaining balance", () => {
    const tenDot = "10000000000";

    it.each([
      ["DOT", "assethub_polkadot", tenDot, "dotMinimumBalance", { minValue: "1" }],
      ["XLM", "stellar", "1", "xlmMinimumBalance", { minValue: "0.0000001" }],
    ])(
      "keeps the %s minimum, to the atomic unit",
      (_ticker, currencyId, minimumAtomic, code, values) => {
        const fee = "7";
        const sent = new BigNumber(100);
        const balanceAtLimit = sent.plus(fee).plus(minimumAtomic).toFixed();
        const balanceBelowLimit = sent.plus(fee).plus(minimumAtomic).minus(1).toFixed();
        const quoteResult = { quote: quoteWithFee(fee), errors: [] };

        expect(
          resolve(account(currencyId, balanceAtLimit), { sentAmountAtomic: sent, quoteResult }),
        ).toBeNull();
        expect(
          resolve(account(currencyId, balanceBelowLimit), { sentAmountAtomic: sent, quoteResult }),
        ).toMatchObject({ code, values });
      },
    );

    it.each([
      ["no quote", { errors: [] }],
      ["no fee estimate", { quote: quoteWithFee(), errors: [] }],
    ])(
      "shows no quote for DOT and XLM with %s, and never assumes a zero fee",
      (_case, quoteResult) => {
        expect(resolve(account("assethub_polkadot", "1"), { quoteResult })?.code).toBe("noQuotes");
        expect(resolve(account("stellar", "1"), { quoteResult })?.code).toBe("noQuotes");
      },
    );

    it("comes before the amount limits", () => {
      expect(
        resolve(account("stellar", "107"), {
          quoteResult: {
            quote: quoteWithFee("7"),
            errors: [{ code: QuotesErrorCodes.AMOUNT_TOO_HIGH, maxAmount: "1" }],
          },
        })?.code,
      ).toBe("xlmMinimumBalance");
    });

    it("comes after the fee error", () => {
      expect(
        resolve(account("stellar", "100"), {
          sentAmountAtomic: new BigNumber(100),
          quoteResult: { quote: quoteWithFee("7"), errors: [] },
        })?.code,
      ).toBe("notEnoughFees");
    });

    it("does not apply to a token", () => {
      const parentAccount = account("assethub_polkadot", tenDot);
      expect(resolve(token(parentAccount), { parentAccount })).toBeNull();
    });
  });
});
