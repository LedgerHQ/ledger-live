import { AptosAccount, AptosStake } from "@ledgerhq/live-common/families/aptos/types";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import invariant from "invariant";
import React, { useCallback, useMemo, useState } from "react";
import { TFunction, useTranslation } from "react-i18next";
import { ScrollView } from "react-native";
import InfoItem from "~/components/BalanceSummaryInfoItem";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import { useAccountUnit } from "~/hooks/useAccountUnit";
import type { ModalInfo } from "~/modals/Info";
import InfoModal from "~/modals/Info";
import BigNumber from "bignumber.js";
import { getCryptoCurrencyIcon } from "@ledgerhq/live-common/reactNative";

type Props = {
  account: AptosAccount;
};
type InfoName = "available" | "storageUsage" | "staked" | "pending" | "withdrawable";

function AccountBalanceSummaryFooter({ account }: Props) {
  const unit = useAccountUnit(account);
  const { t } = useTranslation();
  const [infoName, setInfoName] = useState<InfoName>();
  const onCloseModal = useCallback(() => {
    setInfoName(undefined);
  }, []);
  const onPressInfoCreator = useCallback((infoName: InfoName) => () => setInfoName(infoName), []);
  const info = useMemo(() => getInfo(t), [t]);
  const spendableBalance = account.spendableBalance;
  const delegatedAmount = account.aptosResources?.stakes?.reduce(
    (total: number, stake: AptosStake) => total + stake.stakeAccBalance,
    0,
  );

  const stakedBalance = BigNumber(delegatedAmount);

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
      {stakedBalance.gt(0) && (
        <InfoItem
          title={t("aptos.info.staked.title")}
          onPress={onPressInfoCreator("staked")}
          value={<CurrencyUnitValue unit={unit} value={stakedBalance} disableRounding />}
        />
      )}
    </ScrollView>
  );
}

export default function AccountBalanceFooter({ account }: Props) {
  if (!account.aptosResources || account.balance.lte(0)) return null;
  return <AccountBalanceSummaryFooter account={account} />;
}

function getInfo(t: TFunction<"translation">): Record<InfoName, ModalInfo[]> {
  const currency = getCryptoCurrencyById("aptos");
  const AptosIcon = getCryptoCurrencyIcon(currency);
  invariant(AptosIcon, "Icon is expected");
  return {
    available: [
      {
        Icon: () => <AptosIcon color={currency.color} size={18} />,
        title: t("aptos.info.available.title"),
        description: t("aptos.info.available.description"),
      },
    ],
    storageUsage: [
      {
        title: t("aptos.info.storageUsage.title"),
        description: t("aptos.info.storageUsage.description"),
      },
    ],
    staked: [
      {
        title: t("aptos.info.staked.title"),
        description: t("aptos.info.staked.description"),
      },
    ],
    pending: [
      {
        title: t("aptos.info.pending.title"),
        description: t("aptos.info.pending.description"),
      },
    ],
    withdrawable: [
      {
        title: t("aptos.info.withdrawable.title"),
        description: t("aptos.info.withdrawable.description"),
      },
    ],
  };
}
