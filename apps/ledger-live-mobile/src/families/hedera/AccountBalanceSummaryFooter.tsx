import React, { useCallback, useMemo, useState } from "react";
import { TFunction, useTranslation } from "react-i18next";
import { ScrollView } from "react-native";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { HederaAccount } from "@ledgerhq/live-common/families/hedera/types";
import { getCryptoCurrencyIcon } from "@ledgerhq/live-common/reactNative";
import InfoItem from "~/components/BalanceSummaryInfoItem";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import { useAccountUnit } from "~/hooks/useAccountUnit";
import type { ModalInfo } from "~/modals/Info";
import InfoModal from "~/modals/Info";
import { useStake } from "LLM/hooks/useStake/useStake";

interface Props {
  account: HederaAccount;
}

type InfoName = "available" | "delegated" | "claimable";

function AccountBalanceSummaryFooter({ account }: Props) {
  invariant(account.hederaResources, "hedera: hederaResources is missing");
  const { t } = useTranslation();
  const { getCanStakeCurrency } = useStake();
  const [infoName, setInfoName] = useState<InfoName>();
  const info = useMemo(() => getInfo(t), [t]);
  const unit = useAccountUnit(account);

  const onCloseModal = useCallback(() => setInfoName(undefined), []);

  const onPressInfoCreator = useCallback((infoName: InfoName) => () => setInfoName(infoName), []);

  const isStakingEnabled = getCanStakeCurrency(account.currency.id);
  const { delegation } = account.hederaResources;
  const spendableBalance = account.spendableBalance;
  const delegatedAssets = delegation?.delegated ?? new BigNumber(0);
  const claimableRewards = delegation?.pendingReward ?? new BigNumber(0);
  const hasDelegationInfo = isStakingEnabled && !!delegation;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[{ paddingHorizontal: 16 }]}
    >
      <InfoModal
        isOpened={!!infoName}
        onClose={onCloseModal}
        data={infoName ? info[infoName] : []}
      />
      <InfoItem
        isLast={!hasDelegationInfo}
        title={t("account.availableBalance")}
        onPress={hasDelegationInfo ? onPressInfoCreator("available") : undefined}
        value={<CurrencyUnitValue unit={unit} value={spendableBalance} disableRounding />}
      />
      {hasDelegationInfo && (
        <>
          <InfoItem
            title={t("hedera.info.delegated.title")}
            onPress={onPressInfoCreator("delegated")}
            value={<CurrencyUnitValue unit={unit} value={delegatedAssets} disableRounding />}
          />
          <InfoItem
            isLast
            title={t("hedera.info.claimable.title")}
            onPress={onPressInfoCreator("claimable")}
            value={<CurrencyUnitValue unit={unit} value={claimableRewards} disableRounding />}
          />
        </>
      )}
    </ScrollView>
  );
}

export default function AccountBalanceFooter({ account }: Props) {
  if (!account.hederaResources) {
    return null;
  }

  return <AccountBalanceSummaryFooter account={account} />;
}

function getInfo(t: TFunction<"translation">): Record<InfoName, ModalInfo[]> {
  const currency = getCryptoCurrencyById("hedera");
  const HederaIcon = getCryptoCurrencyIcon(currency);
  invariant(HederaIcon, "Icon is expected");

  return {
    available: [
      {
        Icon: () => <HederaIcon color={currency.color} size={18} />,
        title: t("hedera.info.available.title"),
        description: t("hedera.info.available.description"),
      },
    ],
    delegated: [
      {
        title: t("hedera.info.delegated.title"),
        description: t("hedera.info.delegated.description"),
      },
    ],
    claimable: [
      {
        title: t("hedera.info.claimable.title"),
        description: t("hedera.info.claimable.description"),
      },
    ],
  };
}
