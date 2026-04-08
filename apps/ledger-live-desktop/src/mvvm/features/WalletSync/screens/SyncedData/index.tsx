import React, { forwardRef, useImperativeHandle } from "react";
import {
  Divider,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { counterValueCurrencySelector, languageSelector } from "~/renderer/reducers/settings";
import { useAccountName } from "~/renderer/reducers/wallet";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import { Languages, Language } from "~/config/languages";
import { useFlows } from "../../hooks/useFlows";
import { BackRef, BackProps } from "../router";
import TrackPage from "~/renderer/analytics/TrackPage";
import { AnalyticsPage } from "../../hooks/useLedgerSyncAnalytics";
import { Account } from "@ledgerhq/types-live";

const AccountRow = ({ account }: { account: Account }) => {
  const name = useAccountName(account);
  const currency = getAccountCurrency(account);

  return (
    <ListItem>
      <ListItemLeading>
        <CryptoCurrencyIcon currency={currency} size={32} />
        <ListItemContent>
          <ListItemTitle>{name}</ListItemTitle>
          <ListItemDescription>{currency.name}</ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
    </ListItem>
  );
};

const SettingRow = ({ label, value }: { label: string; value: string }) => (
  <ListItem>
    <ListItemLeading>
      <ListItemContent>
        <ListItemTitle>{label}</ListItemTitle>
      </ListItemContent>
    </ListItemLeading>
    <ListItemTrailing>
      <span className="body-2-semi-bold text-base">{value}</span>
    </ListItemTrailing>
  </ListItem>
);

const WalletSyncSyncedData = forwardRef<BackRef, BackProps>((_props, ref) => {
  const { t } = useTranslation();
  const { goToWelcomeScreenWalletSync } = useFlows();
  const accounts = useSelector(accountsSelector);
  const language = useSelector(languageSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);

  useImperativeHandle(ref, () => ({
    goBack: () => goToWelcomeScreenWalletSync(),
  }));

  const languageLabel =
    language && language in Languages
      ? Languages[language as Language].label
      : language || "English";

  const counterValueLabel = `${counterValueCurrency.name} - ${counterValueCurrency.ticker}`;

  return (
    <div className="flex flex-1 flex-col gap-24 px-40">
      <TrackPage category={AnalyticsPage.SyncedData} />
      <h2 className="heading-3">{t("walletSync.syncedData.title")}</h2>

      <section className="flex flex-col gap-8">
        <span className="body-2-semi-bold text-muted">
          {t("walletSync.syncedData.settings")}
        </span>
        <div className="flex flex-col gap-4">
          <SettingRow label={t("walletSync.syncedData.language")} value={languageLabel} />
          <SettingRow
            label={t("walletSync.syncedData.counterValue")}
            value={counterValueLabel}
          />
        </div>
      </section>

      <Divider />

      <section className="flex flex-col gap-8">
        <span className="body-2-semi-bold text-muted">
          {t("walletSync.syncedData.accounts")}
        </span>
        <div className="flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-400px)]">
          {accounts.map(account => (
            <AccountRow key={account.id} account={account} />
          ))}
        </div>
      </section>
    </div>
  );
});

WalletSyncSyncedData.displayName = "WalletSyncSyncedData";
export default WalletSyncSyncedData;
