import { accountsSlice, type AccountId, type AccountsState } from "@domain/entity-account";
import { currencyIdFromNetwork } from "@domain/entity-account-descriptor";
import type { CryptoOrTokenCurrencyId, Currency } from "@domain/entity-currency";
import { FiatCurrencyTickerSchema } from "@domain/entity-currency-fiat";
import { calculate, type CounterValuesCacheView } from "@domain/entity-market-countervalues";
import { UnknownAccountError } from "./errors";
import {
  readAllOperations,
  type ReadOperationsDispatch,
  type ReadOperationsState,
} from "./internals/readAllOperations";
import { toOperationsCsv, type OperationsCsvCountervalue } from "./internals/toOperationsCsv";

export type OperationsCsvState = ReadOperationsState & { accountEntries: AccountsState };

export type OperationsCsvAccountRequest = Readonly<{
  id: AccountId;
  name: string;
  /** What the "Account xpub" column identifies the account with: its xpub, or its address. */
  xpub: string;
}>;

export type ExportAccountsOperationsCsvOptions = Readonly<{
  /** The fiat the operations are valued in; without it, the countervalue columns stay empty. */
  countervalueCurrency?: Currency;
  /** The rates the app holds, for the value at export time. */
  countervalues?: CounterValuesCacheView;
  /**
   * The currency of an asset, a coin or a token. An unknown asset (`undefined`) leaves its operations
   * out; a lookup that fails rejects the export.
   */
  findCurrency: (
    assetId: CryptoOrTokenCurrencyId,
  ) => Currency | undefined | Promise<Currency | undefined>;
}>;

/**
 * Rows asked per page. Being part of the query, it also gives the export its own window: what a
 * screen shows of the same operations is neither reset nor superseded by an export.
 */
const EXPORT_PAGE_SIZE = 100;

const { selectAccountEntry, selectAccountUUIDByLegacyId } = accountsSlice.getSelectors(
  (state: OperationsCsvState) => state.accountEntries,
);

/** The ticker the reads value operations in: only a fiat has one, a crypto countervalue has none. */
const fiatTickerOf = (currency: Currency | undefined) => {
  if (currency?.type !== "FiatCurrency") return undefined;
  const ticker = FiatCurrencyTickerSchema.safeParse(currency.ticker);
  return ticker.success ? ticker.data : undefined;
};

/** The currency of each asset, looked up once: the CSV is then written synchronously. */
async function currenciesOf(
  findCurrency: ExportAccountsOperationsCsvOptions["findCurrency"],
  assetIds: readonly CryptoOrTokenCurrencyId[],
) {
  const found = await Promise.all(
    [...new Set(assetIds)].map(async assetId => [assetId, await findCurrency(assetId)] as const),
  );
  const byAssetId = new Map(found);
  return (assetId: CryptoOrTokenCurrencyId) => byAssetId.get(assetId);
}

function countervalueOf({
  countervalueCurrency,
  countervalues,
}: ExportAccountsOperationsCsvOptions): OperationsCsvCountervalue | undefined {
  if (!countervalueCurrency) return undefined;
  return {
    currency: countervalueCurrency,
    fiatTicker: fiatTickerOf(countervalueCurrency),
    valueOf: (amount, from, date) =>
      countervalues &&
      calculate(countervalues, {
        from,
        to: countervalueCurrency,
        value: Number(amount),
        disableRounding: true,
        date,
      }),
  };
}

/**
 * Reads every operation of the accounts again, then writes them as the history CSV, in the order of
 * the requested accounts. Rejects when an account is unknown or one of its reads fails.
 */
export function exportAccountsOperationsCsv(
  accounts: readonly OperationsCsvAccountRequest[],
  options: ExportAccountsOperationsCsvOptions,
) {
  return async (
    dispatch: ReadOperationsDispatch,
    getState: () => OperationsCsvState,
  ): Promise<string> => {
    const fiatTicker = fiatTickerOf(options.countervalueCurrency);
    const query = fiatTicker
      ? { countervalue: fiatTicker, limit: EXPORT_PAGE_SIZE }
      : { limit: EXPORT_PAGE_SIZE };

    const entries = accounts.map(({ id, name, xpub }) => {
      const accountUUID = selectAccountUUIDByLegacyId(getState(), id);
      const entry = accountUUID && selectAccountEntry(getState(), accountUUID);
      if (!entry) throw new UnknownAccountError(id);
      return { name, xpub, descriptor: entry.descriptor };
    });

    const read = await Promise.all(
      entries.map(async ({ name, xpub, descriptor }) => ({
        name,
        xpub,
        nativeAssetId: currencyIdFromNetwork(descriptor.network),
        operations: await readAllOperations(dispatch, getState, descriptor, query),
      })),
    );

    const assetIds = read.flatMap(({ operations }) => operations.map(({ assetId }) => assetId));
    return toOperationsCsv({
      accounts: read,
      currencyOf: await currenciesOf(options.findCurrency, assetIds),
      countervalue: countervalueOf(options),
    });
  };
}
