import { useMemo } from "react";
import { useSelector } from "~/context/hooks";
import { AccountLike, DailyOperationsSection, Operation, Account } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { isConfirmedOperation } from "@ledgerhq/live-common/operation";
import { currencySettingsDefaults } from "~/helpers/CurrencySettingsDefaults";
import { accountsSelector, flattenAccountsSelector } from "~/reducers/accounts";
import type { CurrencySettings, State } from "~/reducers/types";

export type OperationsListSection = DailyOperationsSection & { isPending?: boolean };

function resolveConfirmationsNb(
  mainAccount: Account,
  currenciesSettings: Record<string, CurrencySettings>,
): number {
  const saved = currenciesSettings[mainAccount.currency.ticker];
  if (saved?.confirmationsNb !== undefined) return saved.confirmationsNb;
  const defaults = currencySettingsDefaults(mainAccount.currency);
  return defaults.confirmationsNb?.def ?? 0;
}

function isPendingOperationOfAccount(
  op: Operation,
  acc: AccountLike,
  mainAccountById: Map<string, Account>,
  confirmationsNbByTicker: Map<string, number>,
  currenciesSettings: Record<string, CurrencySettings>,
): boolean {
  if (op.hasFailed) return false;

  const parentAcc = acc.type === "Account" ? undefined : mainAccountById.get(acc.parentId);
  const mainAcc = getMainAccount(acc, parentAcc);
  const { ticker } = mainAcc.currency;

  let confirmationsNb = confirmationsNbByTicker.get(ticker);
  if (confirmationsNb === undefined) {
    confirmationsNb = resolveConfirmationsNb(mainAcc, currenciesSettings);
    confirmationsNbByTicker.set(ticker, confirmationsNb);
  }

  return !isConfirmedOperation(op, mainAcc, confirmationsNb);
}

function isPendingOp(
  op: Operation,
  flattenedAccountsById: Map<string, AccountLike>,
  mainAccountById: Map<string, Account>,
  confirmationsNbByTicker: Map<string, number>,
  currenciesSettings: Record<string, CurrencySettings>,
): boolean {
  const acc = flattenedAccountsById.get(op.accountId);
  if (!acc) return false;

  return isPendingOperationOfAccount(
    op,
    acc,
    mainAccountById,
    confirmationsNbByTicker,
    currenciesSettings,
  );
}

export function buildOperationsSections(
  rawSections: DailyOperationsSection[],
  flattenedAccountsById: Map<string, AccountLike>,
  mainAccountById: Map<string, Account>,
  currenciesSettings: Record<string, CurrencySettings>,
): OperationsListSection[] {
  if (rawSections.length === 0) return [];

  const pendingOps: Operation[] = [];
  const regularSections: DailyOperationsSection[] = [];
  // Cache confirmationsNb per ticker to avoid redundant lookups across ops of the same currency
  const confirmationsNbByTicker = new Map<string, number>();

  for (const section of rawSections) {
    const regular: Operation[] = [];
    for (const op of section.data) {
      if (
        isPendingOp(
          op,
          flattenedAccountsById,
          mainAccountById,
          confirmationsNbByTicker,
          currenciesSettings,
        )
      ) {
        pendingOps.push(op);
      } else {
        regular.push(op);
      }
    }
    if (regular.length > 0) {
      regularSections.push({ ...section, data: regular });
    }
  }

  if (pendingOps.length === 0) return regularSections;

  return [{ isPending: true, day: new Date(), data: pendingOps }, ...regularSections];
}

function useMainAccountById(): Map<string, Account> {
  const accounts = useSelector(accountsSelector);

  return useMemo(() => {
    const map = new Map<string, Account>();
    for (const acc of accounts) {
      map.set(acc.id, acc);
    }
    return map;
  }, [accounts]);
}

export function useIsPendingOperation(): (op: Operation, account: AccountLike) => boolean {
  const mainAccountById = useMainAccountById();
  const currenciesSettings = useSelector((state: State) => state.settings.currenciesSettings);

  return useMemo(() => {
    const confirmationsNbByTicker = new Map<string, number>();

    return function isPendingOperation(op: Operation, account: AccountLike) {
      return isPendingOperationOfAccount(
        op,
        account,
        mainAccountById,
        confirmationsNbByTicker,
        currenciesSettings,
      );
    };
  }, [mainAccountById, currenciesSettings]);
}

export function useOperationsSections(
  rawSections: DailyOperationsSection[],
): OperationsListSection[] {
  const flattenedAccounts = useSelector(flattenAccountsSelector);
  const currenciesSettings = useSelector((state: State) => state.settings.currenciesSettings);

  const flattenedAccountsById = useMemo(() => {
    const map = new Map<string, AccountLike>();
    for (const acc of flattenedAccounts) {
      map.set(acc.id, acc);
    }
    return map;
  }, [flattenedAccounts]);

  const mainAccountById = useMainAccountById();

  return useMemo(
    () =>
      buildOperationsSections(
        rawSections,
        flattenedAccountsById,
        mainAccountById,
        currenciesSettings,
      ),
    [rawSections, flattenedAccountsById, mainAccountById, currenciesSettings],
  );
}
