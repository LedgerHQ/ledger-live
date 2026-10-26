import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import BigNumber from "bignumber.js";
import { accountsSlice } from "@domain/entity-account";
import {
  portfolioErrorMessage,
  readOrCreatePortfolioId,
  usePortfolioAccounts,
  type PortfolioBalanceLine,
  type PortfolioServiceAccount,
  type PortfolioWalletAccount,
} from "@features/platform-account-portfolio";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import type { Account } from "@ledgerhq/types-live";
import { useSelector } from "LLD/hooks/redux";
import type { State } from "~/renderer/reducers";
import { accountsSelector } from "~/renderer/reducers/accounts";
import {
  counterValueCurrencySelector,
  discreetModeSelector,
  localeSelector,
} from "~/renderer/reducers/settings";
import { accountNameWithDefaultSelector, walletSelector } from "~/renderer/reducers/wallet";
import type {
  ServiceAccountRowView,
  ServiceAccountsProps,
  ServiceAccountsViewProps,
} from "../types";
import { filterServiceAccountRows } from "../utils/filterServiceAccountRows";

export const PORTFOLIO_SERVICE_ID_KEY = "ledger-live.portfolio-service.portfolio-id";

const { selectAccountEntries } = accountsSlice.getSelectors((state: State) => state.accountEntries);

const capitalize = (text: string) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : text);

export function useServiceAccountsViewModel({
  searchValue = "",
  emptyState,
}: ServiceAccountsProps): ServiceAccountsViewProps {
  const { t } = useTranslation();
  const entries = useSelector(selectAccountEntries);
  const legacyAccounts = useSelector(accountsSelector);
  const wallet = useSelector(walletSelector);
  const counterValue = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);
  const [portfolioId] = useState(() =>
    readOrCreatePortfolioId(globalThis.localStorage, PORTFOLIO_SERVICE_ID_KEY),
  );

  const legacyByUUID = useMemo(() => {
    const legacyById = new Map<string, Account>(
      legacyAccounts.map(account => [account.id, account]),
    );
    return new Map(
      entries.flatMap(({ accountUUID, legacyId }) => {
        const legacy = legacyId === undefined ? undefined : legacyById.get(legacyId);
        return legacy ? [[accountUUID, legacy] as const] : [];
      }),
    );
  }, [entries, legacyAccounts]);
  const walletAccounts = useMemo<PortfolioWalletAccount[]>(
    () =>
      entries.map(({ accountUUID, descriptor }) => {
        const legacy = legacyByUUID.get(accountUUID);
        return { accountUUID, descriptor, addresses: legacy ? [legacy.freshAddress] : [] };
      }),
    [entries, legacyByUUID],
  );

  const portfolio = usePortfolioAccounts({
    portfolioId,
    walletAccounts,
    currency: counterValue.ticker,
  });

  const format = useMemo(() => {
    const fiatUnit = counterValue.units[0];
    return {
      fiat: (value: number) =>
        formatCurrencyUnit(fiatUnit, new BigNumber(value).shiftedBy(fiatUnit.magnitude), {
          locale,
          showCode: true,
          discreet,
        }),
      balance: ({ ticker, decimals, amount }: PortfolioBalanceLine) =>
        formatCurrencyUnit(
          { name: ticker, code: ticker, magnitude: decimals },
          new BigNumber(amount),
          {
            locale,
            showCode: true,
            disableRounding: true,
            discreet,
          },
        ),
    };
  }, [counterValue, discreet, locale]);

  const rows = useMemo(() => {
    const toRow = (account: PortfolioServiceAccount): ServiceAccountRowView => {
      const legacy = account.accountUUID ? legacyByUUID.get(account.accountUUID) : undefined;
      return {
        id: account.id,
        name: legacy ? accountNameWithDefaultSelector(wallet, legacy) : capitalize(account.network),
        address: legacy?.freshAddress ?? account.id,
        network: account.network,
        status: account.status,
        error: account.error ?? null,
        value: account.value,
        valueLabel: account.value === null ? null : format.fiat(account.value),
        balanceLabel: account.balances.map(format.balance).join(" · ") || null,
        pending: account.balances.some(line => line.pending),
      };
    };
    return filterServiceAccountRows(portfolio.accounts.map(toRow), searchValue);
  }, [format, legacyByUUID, portfolio.accounts, searchValue, wallet]);

  const error =
    portfolio.error === undefined
      ? null
      : (portfolioErrorMessage(portfolio.error) ?? t("portfolio.service.requestFailed"));

  return {
    phase:
      portfolio.status === "ready" || portfolio.status === "error" ? portfolio.status : "loading",
    error,
    totalLabel: portfolio.total === null ? null : format.fiat(portfolio.total),
    skippedCount: portfolio.skippedCount,
    rows,
    emptyState,
  };
}
