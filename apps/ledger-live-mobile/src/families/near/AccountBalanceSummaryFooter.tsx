import { getAccountUnit } from "@ledgerhq/live-common/account/helpers";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { NearAccount } from "@ledgerhq/live-common/families/near/types";
import { getCryptoCurrencyIcon } from "@ledgerhq/live-common/reactNative";
import invariant from "invariant";
import React, { useCallback, useMemo, useState } from "react";
import { TFunction, useTranslation } from "react-i18next";
import { ScrollView } from "react-native";
import InfoItem from "~/components/BalanceSummaryInfoItem";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import type { ModalInfo } from "~/modals/Info";
import InfoModal from "~/modals/Info";

type Props = {
  account: NearAccount;
};
type InfoName = "available" | "storageUsage" | "staked" | "pending" | "withdrawable";

function AccountBalanceSummaryFooter({ account }: Props) {
  const { t } = useTranslation();
  const [infoName, setInfoName] = useState<InfoName>();
  const info = useMemo(() => getInfo(t), [t]);
  const { spendableBalance, nearResources } = account;
  const { storageUsageBalance, stakedBalance, pendingBalance, availableBalance } =
    nearResources || {};
  const unit = getAccountUnit(account);
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
      <InfoItem
        title={t("near.info.storageUsage.title")}
        onPress={onPressInfoCreator("storageUsage")}
        value={<CurrencyUnitValue unit={unit} value={storageUsageBalance} disableRounding />}
      />
      {stakedBalance.gt(0) && (
        <InfoItem
          title={t("near.info.staked.title")}
          onPress={onPressInfoCreator("staked")}
          value={<CurrencyUnitValue unit={unit} value={stakedBalance} disableRounding />}
        />
      )}
      {pendingBalance.gt(0) && (
        <InfoItem
          title={t("near.info.pending.title")}
          onPress={onPressInfoCreator("pending")}
          value={<CurrencyUnitValue unit={unit} value={pendingBalance} disableRounding />}
        />
      )}
      {availableBalance.gt(0) && (
        <InfoItem
          title={t("near.info.withdrawable.title")}
          onPress={onPressInfoCreator("withdrawable")}
          value={<CurrencyUnitValue unit={unit} value={availableBalance} disableRounding />}
        />
      )}
    </ScrollView>
  );
}

export default function AccountBalanceFooter({ account }: Props) {
  if (!account.nearResources || account.balance.lte(0)) return null;
  return <AccountBalanceSummaryFooter account={account} />;
}

function getInfo(t: TFunction<"translation">): Record<InfoName, ModalInfo[]> {
  const currency = getCryptoCurrencyById("near");
  const NearIcon = getCryptoCurrencyIcon(currency);
  invariant(NearIcon, "Icon is expected");
  return {
    available: [
      {
        Icon: () => <NearIcon color={currency.color} size={18} />,
        title: t("near.info.available.title"),
        description: t("near.info.available.description"),
      },
    ],
    storageUsage: [
      {
        title: t("near.info.storageUsage.title"),
        description: t("near.info.storageUsage.description"),
      },
    ],
    staked: [
      {
        title: t("near.info.staked.title"),
        description: t("near.info.staked.description"),
      },
    ],
    pending: [
      {
        title: t("near.info.pending.title"),
        description: t("near.info.pending.description"),
      },
    ],
    withdrawable: [
      {
        title: t("near.info.withdrawable.title"),
        description: t("near.info.withdrawable.description"),
      },
    ],
  };
}
