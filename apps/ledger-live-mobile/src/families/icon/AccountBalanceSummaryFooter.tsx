import { getAccountUnit } from "@ledgerhq/live-common/account/helpers";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { IconAccount } from "@ledgerhq/live-common/families/icon/types";
import { getCryptoCurrencyIcon } from "@ledgerhq/live-common/reactNative";
import type { Account } from "@ledgerhq/types-live";
import invariant from "invariant";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";
import { useSelector } from "react-redux";
import InfoItem from "../../components/BalanceSummaryInfoItem";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import EnergyIcon from "../../icons/Energy";

import FreezeIcon from "../../icons/Freeze";
import UnfreezeIcon from "../../icons/Unfreeze";
import Vote from "../../icons/Vote";
import type { ModalInfo } from "../../modals/Info";
import InfoModal from "../../modals/Info";
import { localeSelector } from "../../reducers/settings";

type Props = {
  account: Account;
};
type InfoName = "available" | "voting_power" | "voted" | "unstake";

function AccountBalanceSummaryFooter({ account }: Props) {
  const { t } = useTranslation();
  const locale = useSelector(localeSelector);
  const [infoName, setInfoName] = useState<InfoName | typeof undefined>();
  const infoCandidates = useInfoCandidates();
  const {
    votingPower,
    totalDelegated,
    unstake
  } = (account as IconAccount).iconResources || {};

  const unit = getAccountUnit(account);

  const onCloseModal = useCallback(() => {
    setInfoName(undefined);
  }, []);
  const onPressInfoCreator = useCallback(
    (infoName: InfoName) => () => setInfoName(infoName),
    [],
  );
  return (
    <>
      <InfoModal
        isOpened={!!infoName}
        onClose={onCloseModal}
        data={infoName ? infoCandidates[infoName] : []}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
        }}
      >
        <InfoItem
          title={t("icon.account.availableBalance")}
          onPress={onPressInfoCreator("available")}
          value={
            <CurrencyUnitValue unit={unit} value={account.spendableBalance} />
          }
        />
        <InfoItem
          title={t("icon.account.votingPower")}
          onPress={onPressInfoCreator("voting_power")}
          value={Number(votingPower)?.toLocaleString(locale) || 0}
        />
        <InfoItem
          title={t("icon.account.voted")}
          onPress={onPressInfoCreator("voted")}
          value={
            Number(totalDelegated).toLocaleString(locale) || 0
          }
        />
        <InfoItem
          title={t("icon.account.unstake")}
          onPress={onPressInfoCreator("unstake")}
          value={
            Number(unstake).toLocaleString(locale) || 0
          }
          isLast={true}
        />
      </ScrollView>
    </>
  );
}

export default function AccountBalanceFooter({ account }: Props) {
  if (!(account as IconAccount).iconResources) return null;
  return <AccountBalanceSummaryFooter account={account} />;
}

function useInfoCandidates(): Record<InfoName, ModalInfo[]> {
  const { t } = useTranslation();
  const currency = getCryptoCurrencyById("icon");
  const ICONIcon = getCryptoCurrencyIcon(currency);
  invariant(ICONIcon, "Icon is expected");
  return {
    available: [
      {
        Icon: () => <ICONIcon color={currency.color} size={18} />,
        title: t("icon.info.available.title"),
        description: t("icon.info.available.description"),
      },
    ],
    voting_power: [
      {
        Icon: () => <EnergyIcon size={18} color={currency.color} />,
        title: t("icon.info.votingPower.title"),
        description: t("icon.info.votingPower.description"),
      },
    ],
    voted: [
      {
        Icon: () => <FreezeIcon size={18} color={currency.color}/>,
        title: t("icon.info.voted.title"),
        description: t("icon.info.voted.description"),
      },
    ],
    unstake: [
      {
        Icon: () => <UnfreezeIcon size={18} color={currency.color} />,
        title: t("icon.info.unstake.title"),
        description: t("icon.info.unstake.description"),
      },
    ],
  };
}
