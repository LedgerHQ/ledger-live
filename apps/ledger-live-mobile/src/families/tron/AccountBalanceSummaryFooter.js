// @flow

import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/lib/currencies";
import { getAccountUnit } from "@ledgerhq/live-common/lib/account/helpers";
import { getCryptoCurrencyIcon } from "@ledgerhq/live-common/lib/reactNative";

import type { Account } from "@ledgerhq/live-common/lib/types";

import invariant from "invariant";
import { useTheme } from "@react-navigation/native";
import InfoModal from "../../modals/Info";
import type { ModalInfo } from "../../modals/Info";
import FreezeIcon from "../../icons/Freeze";
import BandwidthIcon from "../../icons/Bandwidth";
import EnergyIcon from "../../icons/Energy";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import InfoItem from "../../components/BalanceSummaryInfoItem";

type Props = {
  account: Account,
};

type InfoName = "available" | "frozen" | "bandwidth" | "energy";

function AccountBalanceSummaryFooter({ account }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [infoName, setInfoName] = useState<InfoName | typeof undefined>();
  const infoCandidates = useInfoCandidates();

  const { energy: formattedEnergy, bandwidth, tronPower } =
    account.tronResources || {};

  const { freeUsed, freeLimit, gainedUsed, gainedLimit } = bandwidth || {};

  const unit = getAccountUnit(account);

  const formattedBandwidth = useMemo(
    () =>
      freeLimit
        .plus(gainedLimit)
        .minus(gainedUsed)
        .minus(freeUsed),
    [freeLimit, gainedLimit, gainedUsed, freeUsed],
  );

  const onCloseModal = useCallback(() => {
    setInfoName(undefined);
  }, []);

  const onPressInfoCreator = useCallback(
    (infoName: InfoName) => () => setInfoName(infoName),
    [],
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[
        styles.root,
        {
          borderTopColor: colors.lightFog,
        },
      ]}
    >
      <InfoModal
        isOpened={!!infoName}
        onClose={onCloseModal}
        data={infoName ? infoCandidates[infoName] : []}
      />

      <InfoItem
        title={t("account.availableBalance")}
        onPress={onPressInfoCreator("available")}
        value={
          <CurrencyUnitValue unit={unit} value={account.spendableBalance} />
        }
      />
      <InfoItem
        title={t("account.tronFrozen")}
        onPress={onPressInfoCreator("frozen")}
        value={tronPower}
      />
      <InfoItem
        title={t("account.bandwidth")}
        onPress={onPressInfoCreator("bandwidth")}
        value={formattedBandwidth.toString() || "–"}
      />
      <InfoItem
        title={t("account.energy")}
        onPress={onPressInfoCreator("energy")}
        value={formattedEnergy.toString() || "-"}
      />
    </ScrollView>
  );
}

export default function AccountBalanceFooter({ account }: Props) {
  if (!account.tronResources) return null;

  return <AccountBalanceSummaryFooter account={account} />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
    borderTopWidth: 1,
    paddingTop: 16,
    overflow: "visible",
  },
});

function useInfoCandidates(): { [key: InfoName]: ModalInfo[] } {
  const { t } = useTranslation();
  const currency = getCryptoCurrencyById("tron");
  const TronIcon = getCryptoCurrencyIcon(currency);
  invariant(TronIcon, "Icon is expected");

  return {
    available: [
      {
        Icon: () => <TronIcon color={currency.color} size={18} />,
        title: t("tron.info.available.title"),
        description: t("tron.info.available.description"),
      },
    ],
    frozen: [
      {
        Icon: () => <FreezeIcon size={18} />,
        title: t("tron.info.frozen.title"),
        description: t("tron.info.frozen.description"),
      },
    ],
    bandwidth: [
      {
        Icon: () => <BandwidthIcon size={18} />,
        title: t("tron.info.bandwidth.title"),
        description: t("tron.info.bandwidth.description"),
      },
    ],
    energy: [
      {
        Icon: () => <EnergyIcon size={18} />,
        title: t("tron.info.energy.title"),
        description: t("tron.info.energy.description"),
      },
    ],
  };
}
