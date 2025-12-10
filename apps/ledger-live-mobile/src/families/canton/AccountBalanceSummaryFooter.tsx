import { isCantonAccount } from "@ledgerhq/coin-canton";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { CantonAccount } from "@ledgerhq/live-common/families/canton/types";
import { useWithdrawableBalance } from "@ledgerhq/live-common/families/canton/react";
import { CryptoIcon } from "@ledgerhq/native-ui/pre-ldls";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { TFunction } from "i18next";
import { ScrollView } from "react-native";
import InfoItem from "~/components/BalanceSummaryInfoItem";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import { useAccountUnit } from "~/hooks/useAccountUnit";
import type { ModalInfo } from "~/modals/Info";
import InfoModal from "~/modals/Info";
import { AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { accountsSelector } from "~/reducers/accounts";

type Props = {
  readonly account: CantonAccount | AccountLike;
};
type InfoName = "locked" | "available" | "withdrawable";

function AccountBalanceSummaryFooter({ account }: Props) {
  const { t } = useTranslation();
  const [infoName, setInfoName] = useState<InfoName>();
  const info = useMemo(() => getInfo(t, account), [t, account]);
  const unit = useAccountUnit(account);
  const accounts = useSelector(accountsSelector);

  const { balance, spendableBalance } = account;
  const lockedBalance = balance.minus(spendableBalance);
  const withdrawableBalance = useWithdrawableBalance(account, accounts);

  const onCloseModal = useCallback(() => {
    setInfoName(undefined);
  }, []);
  const onPressInfoCreator = useCallback((infoName: InfoName) => () => setInfoName(infoName), []);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[
        {
          paddingHorizontal: 16,
        },
      ]}
    >
      <InfoModal
        isOpened={!!infoName}
        onClose={onCloseModal}
        data={infoName ? info[infoName] : []}
      />
      <InfoItem
        title={t("account.availableBalance")}
        onPress={onPressInfoCreator("available")}
        value={<CurrencyUnitValue unit={unit} value={spendableBalance} disableRounding />}
      />
      {lockedBalance.gt(0) && (
        <InfoItem
          title={t("canton.account.lockedBalance")}
          onPress={onPressInfoCreator("locked")}
          value={<CurrencyUnitValue unit={unit} value={lockedBalance} disableRounding />}
        />
      )}
      {withdrawableBalance.gt(0) && (
        <InfoItem
          title={t("canton.account.withdrawableBalance")}
          onPress={onPressInfoCreator("withdrawable")}
          value={<CurrencyUnitValue unit={unit} value={withdrawableBalance} disableRounding />}
        />
      )}
    </ScrollView>
  );
}

export default function AccountBalanceFooter({ account }: Props) {
  if (account.balance.lte(0)) return null;
  // Check cantonResources exists
  if (!isCantonAccount(account)) return null;
  return <AccountBalanceSummaryFooter account={account} />;
}

function getInfo(
  t: TFunction<"translation">,
  account: CantonAccount | AccountLike,
): Record<InfoName, ModalInfo[]> {
  const accountCurrency = getAccountCurrency(account);
  const currencyId =
    accountCurrency.type === "TokenCurrency"
      ? accountCurrency.parentCurrency.id
      : accountCurrency.id;
  const currency = getCryptoCurrencyById(currencyId);
  return {
    available: [
      {
        Icon: () => <CryptoIcon ledgerId={currency.id} ticker={currency.ticker} size={20} />,
        title: t("account.availableBalance"),
        description: t("account.availableBalanceTooltip"),
      },
    ],
    locked: [
      {
        Icon: () => <CryptoIcon ledgerId={currency.id} ticker={currency.ticker} size={20} />,
        title: t("canton.account.lockedBalance"),
        description: t("canton.account.lockedBalanceTooltip"),
      },
    ],
    withdrawable: [
      {
        Icon: () => <CryptoIcon ledgerId={currency.id} ticker={currency.ticker} size={20} />,
        title: t("canton.account.withdrawableBalance"),
        description: t("canton.account.withdrawableBalanceTooltip"),
      },
    ],
  };
}
