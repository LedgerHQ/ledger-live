// @flow

import React, { useCallback, useMemo, useState } from "react";
import { View, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { translate } from "react-i18next";
import type { TFunction } from "react-i18next";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/lib/currencies";
import { getAccountUnit } from "@ledgerhq/live-common/lib/account/helpers";
import { getCryptoCurrencyIcon } from "@ledgerhq/live-common/lib/reactNative";

import type { Account } from "@ledgerhq/live-common/lib/types";

import invariant from "invariant";
import colors from "../../colors";
import LText from "../../components/LText";
import Info from "../../icons/Info";
import InfoModal from "../../modals/Info";
import type { ModalInfo } from "../../modals/Info";
import FreezeIcon from "../../icons/Freeze";
import BandwidthIcon from "../../icons/Bandwidth";
import EnergyIcon from "../../icons/Energy";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";

interface Props {
  account: Account;
  t: TFunction;
}

type InfoName = "available" | "frozen" | "bandwidth" | "energy";

function AccountBalanceSummaryFooter({ account, t }: Props) {
  const [infoName, setInfoName] = useState<InfoName | typeof undefined>();
  const infoCandidates = useMemo(() => getInfoCandidates(t), [t]);

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
      style={styles.root}
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

const AccountBalanceFooter = ({ account, t }: Props) => {
  if (!account.tronResources) return null;

  return <AccountBalanceSummaryFooter account={account} t={t} />;
};

export default translate()(AccountBalanceFooter);

interface InfoItemProps {
  onPress: () => void;
  title: React$Node;
  value: React$Node;
}

function InfoItem({ onPress, title, value }: InfoItemProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.balanceContainer}>
      <View style={styles.balanceLabelContainer}>
        <LText style={styles.balanceLabel}>{title}</LText>
        <Info size={12} color={colors.grey} />
      </View>
      <LText semiBold style={styles.balance}>
        {value}
      </LText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.lightFog,
    paddingTop: 16,
    overflow: "visible",
  },
  balanceContainer: {
    flexBasis: "auto",
    flexDirection: "column",
    marginRight: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 4,
    backgroundColor: colors.lightGrey,
  },
  balanceLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 4,
  },
  balanceLabel: {
    fontSize: 13,
    lineHeight: 16,
    color: colors.grey,
    marginRight: 6,
  },
  balance: {
    fontSize: 18,
    lineHeight: 22,
    color: colors.darkBlue,
  },
});

function getInfoCandidates(t: TFunction): { [key: InfoName]: ModalInfo[] } {
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
