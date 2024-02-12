import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { getAccountUnit } from "@ledgerhq/live-common/account/helpers";
import { getCryptoCurrencyIcon } from "@ledgerhq/live-common/reactNative";
import type { Account } from "@ledgerhq/types-live";
import invariant from "invariant";
import { withdrawableBalance } from "@ledgerhq/live-common/families/celo/logic";
import { CeloAccount } from "@ledgerhq/live-common/families/celo/types";
import InfoModal from "~/modals/Info";
import type { ModalInfo } from "~/modals/Info";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import InfoItem from "~/components/BalanceSummaryInfoItem";

type Props = {
  account: Account;
};

type InfoName = "available" | "lockedBalance" | "nonvotingLockedBalance" | "withdrawableBalance";

function AccountBalanceSummaryFooter({ account }: Props) {
  const { t } = useTranslation();
  const [infoName, setInfoName] = useState<InfoName | typeof undefined>();
  const info = useInfo();
  const celoAccount = account as CeloAccount;
  const { spendableBalance, celoResources } = celoAccount;
  const { lockedBalance, nonvotingLockedBalance } = celoResources;
  const withdrawableBalanceAmount = withdrawableBalance(celoAccount);
  const unit = getAccountUnit(account);
  const onCloseModal = useCallback(() => {
    setInfoName(undefined);
  }, []);
  const onPressInfoCreator = useCallback((infoName: InfoName) => () => setInfoName(infoName), []);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.root]}
      contentContainerStyle={{
        paddingHorizontal: 16,
      }}
    >
      <InfoModal
        isOpened={!!infoName}
        onClose={onCloseModal}
        data={infoName ? info[infoName] : []}
      />
      <InfoItem
        title={t("account.availableBalance")}
        onPress={onPressInfoCreator("available")}
        value={<CurrencyUnitValue unit={unit} value={spendableBalance} disableRounding={false} />}
      />
      <InfoItem
        title={t("celo.info.lockedBalance.title")}
        onPress={onPressInfoCreator("lockedBalance")}
        value={<CurrencyUnitValue unit={unit} value={lockedBalance} disableRounding={false} />}
      />
      <InfoItem
        title={t("celo.info.nonvotingLockedBalance.title")}
        onPress={onPressInfoCreator("nonvotingLockedBalance")}
        value={
          <CurrencyUnitValue unit={unit} value={nonvotingLockedBalance} disableRounding={false} />
        }
      />
      <InfoItem
        title={t("celo.info.withdrawableBalance.title")}
        onPress={onPressInfoCreator("withdrawableBalance")}
        value={
          <CurrencyUnitValue
            unit={unit}
            value={withdrawableBalanceAmount}
            disableRounding={false}
          />
        }
        isLast={true}
      />
    </ScrollView>
  );
}

export default function AccountBalanceFooter({ account }: Props) {
  if (account.balance.lte(0)) return null;
  return <AccountBalanceSummaryFooter account={account} />;
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
    overflow: "visible",
  },
});

function useInfo(): Record<InfoName, ModalInfo[]> {
  const { t } = useTranslation();
  const currency = getCryptoCurrencyById("celo");
  const CeloIcon = getCryptoCurrencyIcon(currency);
  invariant(CeloIcon, "Icon is expected");
  return {
    available: [
      {
        Icon: () => <CeloIcon color={currency.color} size={18} />,
        title: t("celo.info.available.title"),
        description: t("celo.info.available.description"),
      },
    ],
    lockedBalance: [
      {
        Icon: () => <CeloIcon color={currency.color} size={18} />,
        title: t("celo.info.lockedBalance.title"),
        description: t("celo.info.lockedBalance.description"),
      },
    ],
    nonvotingLockedBalance: [
      {
        Icon: () => <CeloIcon color={currency.color} size={18} />,
        title: t("celo.info.nonvotingLockedBalance.title"),
        description: t("celo.info.nonvotingLockedBalance.description"),
      },
    ],
    withdrawableBalance: [
      {
        Icon: () => <CeloIcon color={currency.color} size={18} />,
        title: t("celo.info.withdrawableBalance.title"),
        description: t("celo.info.withdrawableBalance.description"),
      },
    ],
  };
}
