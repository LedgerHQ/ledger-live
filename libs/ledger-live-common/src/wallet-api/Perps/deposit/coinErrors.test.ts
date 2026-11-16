import BigNumber from "bignumber.js";
import type { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import { QuotesErrorCodes } from "@ledgerhq/wallet-api-exchange-module";
import { getDepositAmountState } from "./usePerpsDepositForm";
import {
  getDepositBaseError,
  resolveDepositFormError,
  type ResolveDepositFormErrorParams,
} from "./formError";
import type { PerpsDepositQuote, PerpsDepositQuoteResult } from "./quote";

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
const seiNotLinked = { readiness: { ready: false, reason: "activationRequired" } };
const tezosUnrevealed = { readiness: { ready: false, reason: "unrevealed" } };

const FEE_ACCOUNT_CURRENCY = "fee-account-currency";

function quoteWithFee(fee?: string): PerpsDepositQuote {
  return {
    amountTo: new BigNumber(1),
    errors: [],
    ...(fee && { estimatedNetworkFee: { amount: fee, currencyId: FEE_ACCOUNT_CURRENCY } }),
  };
}

function inFeeAccountCurrency(
  quoteResult: ResolveDepositFormErrorParams["quoteResult"],
  feeCurrencyId: string | undefined,
): ResolveDepositFormErrorParams["quoteResult"] {
  const fee = quoteResult?.quote?.estimatedNetworkFee;
  if (!quoteResult?.quote || fee?.currencyId !== FEE_ACCOUNT_CURRENCY || !feeCurrencyId) {
    return quoteResult;
  }
  return {
    ...quoteResult,
    quote: { ...quoteResult.quote, estimatedNetworkFee: { ...fee, currencyId: feeCurrencyId } },
  };
}

type ResolveOverrides = Partial<ResolveDepositFormErrorParams> &
  Readonly<{ walletApiBalances?: Map<AccountLike, BigNumber> }>;

function readerOf(walletApiBalances: Map<AccountLike, BigNumber> | undefined) {
  return (account: AccountLike) => walletApiBalances?.get(account) ?? account.spendableBalance;
}

function resolve(
  depositAccount: AccountLike,
  { walletApiBalances, ...overrides }: ResolveOverrides = {},
) {
  const params = {
    isOffline: false,
    depositAccount,
    parentAccount: undefined,
    depositAmount: 20,
    maxAmount: 1e12,
    hasConversion: true,
    sentAmountAtomic: new BigNumber(100),
    quoteResult: { quote: quoteWithFee("1"), errors: [] },
    locale: "en",
    getSpendableBalance: readerOf(walletApiBalances),
    ...overrides,
  };
  const mainAccount =
    params.depositAccount.type === "Account" ? params.depositAccount : params.parentAccount;
  const quoteResult = inFeeAccountCurrency(params.quoteResult, mainAccount?.currency.id);
  return resolveDepositFormError({ ...params, quoteResult });
}

describe("coin errors in the deposit resolver", () => {
  describe("account state, before the balance and the quote", () => {
    it.each([
      ["an unlinked SEI EVM account", account("sei_evm", "1000", seiNotLinked), "seiEvmUnlinked"],
      ["an unrevealed Tezos account", account("tezos", "1000", tezosUnrevealed), "tezosUnrevealed"],
    ])("reports %s with its support article", (_case, depositAccount, code) => {
      const error = resolve(depositAccount, {
        maxAmount: 1,
        quoteResult: { errors: [{ code: QuotesErrorCodes.NO_QUOTES }] },
      });

      expect(error?.code).toBe(code);
      expect(error?.supportUrl).toMatch(/^https:\/\/support\.ledger\.com\//);
    });

    it.each([
      ["a SEI EVM token whose parent is not linked", "sei_evm", seiNotLinked, "seiEvmUnlinked"],
      ["a Tezos token whose parent is not revealed", "tezos", tezosUnrevealed, "tezosUnrevealed"],
    ])("reports %s", (_case, currencyId, readiness, code) => {
      const parentAccount = account(currencyId, "1000", readiness);
      expect(resolve(token(parentAccount), { parentAccount })?.code).toBe(code);
    });

    it("blocks the quote request of a blocked account in the base check", () => {
      expect(
        getDepositBaseError({
          depositAccount: account("tezos", "1000", tezosUnrevealed),
          parentAccount: undefined,
          depositAmount: 20,
          maxAmount: 50,
          hasConversion: true,
          locale: "en",
          getSpendableBalance: readerOf(undefined),
        })?.code,
      ).toBe("tezosUnrevealed");
    });

    it("reports a not ready account of any other chain with the generic error", () => {
      expect(resolve(account("near", "1000", notReady))).toEqual({
        code: "accountNotReady",
        labelKey: "perpsDeposit.formErrors.accountNotReady",
      });
    });

    it("reports an unknown not ready reason of SEI EVM or Tezos with the generic error", () => {
      expect(resolve(account("tezos", "1000", notReady))?.code).toBe("accountNotReady");
      expect(resolve(account("sei_evm", "1000", notReady))?.code).toBe("accountNotReady");
    });

    it("treats a missing readiness as ready", () => {
      expect(resolve(account("tezos", "1000"))).toBeNull();
    });

    it("waits for a positive amount", () => {
      expect(resolve(account("tezos", "1000", notReady), { depositAmount: 0 })).toBeNull();
    });
  });

  describe("aleo", () => {
    const aleo = (publicBalance: string, privateBalance: string) =>
      account("aleo", new BigNumber(publicBalance).plus(privateBalance).toFixed());
    const publicBalances = (...entries: Array<[AccountLike, string]>) =>
      new Map(entries.map(([key, value]) => [key, new BigNumber(value)]));

    it("reports private-only funds with the ticker", () => {
      const depositAccount = aleo("0", "500");
      expect(
        resolve(depositAccount, { walletApiBalances: publicBalances([depositAccount, "0"]) }),
      ).toMatchObject({
        code: "aleoPrivateBalance",
        values: { ticker: "ALEO" },
        supportUrl: "https://support.ledger.com/article/Aleo-ALEO",
      });
    });

    it("uses only the public balance of the parent to pay the fees of a token", () => {
      const parentAccount = aleo("0", "500");
      const aleoToken = token(parentAccount);
      expect(
        resolve(aleoToken, {
          parentAccount,
          walletApiBalances: publicBalances([parentAccount, "0"], [aleoToken, "10"]),
        }),
      ).toMatchObject({
        code: "notEnoughFees",
        labelKey: "perpsDeposit.formErrors.feeAccountEmpty",
      });
    });

    it("reports a private-only token", () => {
      const parentAccount = aleo("10", "0");
      const aleoToken = token(parentAccount, { spendableBalance: new BigNumber(5) });
      expect(
        resolve(aleoToken, { parentAccount, walletApiBalances: publicBalances([aleoToken, "0"]) })
          ?.code,
      ).toBe("aleoPrivateBalance");
    });

    it.each([
      ["public and private funds", "10", "500"],
      ["only staked funds", "0", "0"],
    ])("accepts an account with %s", (_case, publicBalance, privateBalance) => {
      const depositAccount = aleo(publicBalance, privateBalance);
      const walletApiBalances = publicBalances([depositAccount, publicBalance]);
      expect(resolve(depositAccount, { walletApiBalances })?.code).not.toBe("aleoPrivateBalance");
    });

    it("caps the sent amount at the public balance", () => {
      const depositAccount = aleo("10", "500");
      const { sentAmountAtomic } = getDepositAmountState({
        depositAccount,
        parentAccount: undefined,
        depositAmount: 20,
        maxAmount: 50,
        convertedAmount: new BigNumber(400),
        locale: "en",
        getSpendableBalance: readerOf(publicBalances([depositAccount, "10"])),
      });
      expect(sentAmountAtomic?.toFixed()).toBe("10");
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

    it.each([["assethub_polkadot"], ["stellar"]])(
      "shows the fee estimation failure for %s instead of no quote",
      currencyId => {
        const quoteResult = { quote: quoteWithFee(), errors: [], feeEstimationFailed: true };
        expect(resolve(account(currencyId, "1"), { quoteResult })).toEqual({
          code: "feeEstimationFailed",
          labelKey: "perpsDeposit.formErrors.feeEstimationFailed",
        });
      },
    );

    it("shows the amount limit before the fee estimation failure", () => {
      const quoteResult: PerpsDepositQuoteResult = {
        quote: quoteWithFee(),
        errors: [{ code: QuotesErrorCodes.AMOUNT_TOO_HIGH, maxAmount: "1000" }],
        feeEstimationFailed: true,
      };
      expect(resolve(account("stellar", "1"), { quoteResult })?.code).toBe("amountTooHigh");
    });

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

    it("shows no quote, not the minimum, when the fee is in another currency", () => {
      expect(
        resolve(account("stellar", "107"), {
          quoteResult: {
            quote: { ...quoteWithFee(), estimatedNetworkFee: { amount: "7", currencyId: "other" } },
            errors: [],
          },
        })?.code,
      ).toBe("noQuotes");
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
