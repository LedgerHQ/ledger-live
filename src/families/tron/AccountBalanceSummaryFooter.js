// @flow

import React, { useCallback, useMemo, useState } from "react";
import { View, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import {
  formatCurrencyUnit,
  findCryptoCurrencyById,
} from "@ledgerhq/live-common/lib/currencies";
import { getCryptoCurrencyIcon } from "@ledgerhq/live-common/lib/reactNative";
import colors from "../../colors";
import LText from "../../components/LText";
import Info from "../../icons/Info";
import InfoModal from "../../modals/Info";
import type { ModalInfo } from "../../modals/Info";

interface Props {
  account: any;
  countervalue: any;
}

const formatConfig = {
  disableRounding: true,
  alwaysShowSign: false,
  showCode: true,
};

type InfoName = "available" | "power" | "bandwidth" | "energy";

export default function AccountBalanceSummaryFooter({ account }: Props) {
  const [infoName, setInfoName] = useState<InfoName | typeof undefined>();
  const infoCandidates = useMemo(getInfoCandidates, []);

  const {
    energy: formattedEnergy,
    bandwidth: { freeUsed, freeLimit, gainedUsed, gainedLimit } = {},
    tronPower,
  } = account.tronResources;

  const spendableBalance = useMemo(
    () =>
      formatCurrencyUnit(account.unit, account.spendableBalance, formatConfig),
    [account.unit, account.spendableBalance],
  );

  const formattedBandwidth = useMemo(
    () => freeLimit + gainedLimit - gainedUsed - freeUsed,
    [freeLimit, gainedLimit, gainedUsed, freeUsed],
  );

  const onCloseModal = useCallback(() => {
    setInfoName(undefined);
  }, []);

  const onPressInfoCreator = useCallback(
    (infoName: InfoName) => () => setInfoName(infoName),
    [],
  );

  const isModalOpen = useMemo(() => !!infoName, [infoName]);

  const data = useMemo(() => (infoName ? infoCandidates[infoName] : []), [
    infoName,
    infoCandidates,
  ]);

  if (!account.tronResources) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.root}
    >
      <InfoModal isOpened={isModalOpen} onClose={onCloseModal} data={data} />

      <InfoItem
        onPress={onPressInfoCreator("available")}
        value={spendableBalance}
      />
      <InfoItem onPress={onPressInfoCreator("power")} value={tronPower} />
      <InfoItem
        onPress={onPressInfoCreator("bandwidth")}
        value={formattedBandwidth.toString() || "–"}
      />
      <InfoItem
        onPress={onPressInfoCreator("energy")}
        value={formattedEnergy.toString() || "-"}
      />
    </ScrollView>
  );
}

interface InfoItemProps {
  value: string;
  onPress: () => void;
}

function InfoItem({ onPress, value }: InfoItemProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.balanceContainer}>
      <View style={styles.balanceLabelContainer}>
        <LText style={styles.balanceLabel}>
          <Trans i18nKey="account.energy" />
        </LText>
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

function getInfoCandidates(): { [key: InfoName]: ModalInfo[] } {
  const TronIcon = getTronIcon();

  return {
    available: [
      {
        Icon: () => <TronIcon />,
        title: "TRX available",
        description:
          "Bandwidth Points (BP) are used for transactions you do not want to pay for. As such freezing TRX for BP will increase your daily free transactions quantity.",
      },
    ],
    power: [
      {
        Icon: () => <TronIcon />,
        title: "TRON Power",
        description: `
TRX can be frozen to gain TRON Power and enable additional features. For example, with TRON Power you can vote for Super Representatives.You can gain bandwith or energy as well.

Frozen tokens are "locked" for a period of 3 days. During this period the frozen TRX cannot be traded. After this period you can unfreeze the TRX and trade the tokens.

Either one of bandwidth or energy can be acquired by each freeze. You cannot acquire both resources at the same time. When a user unfreeze a certain resource, his previous votes will be completely voided. If a user would like to vote using the remaining TRON Power, he will have to perform his voting operations all over again.
`,
      },
    ],
    bandwidth: [
      {
        Icon: () => <TronIcon />,
        title: "Bandwidth",
        description:
          "Bandwidth Points (BP) are used for transactions you do not want to pay for. As such freezing TRX for BP will increase your daily free transactions quantity.",
      },
    ],
    energy: [
      {
        Icon: () => <TronIcon />,
        title: "Energy",
        description:
          "Bandwidth Points (BP) are used for transactions you do not want to pay for. As such freezing TRX for BP will increase your daily free transactions quantity.",
      },
    ],
  };
}

function getTronIcon(): React$ComponentType<{}> {
  const currency = findCryptoCurrencyById("tron");
  const TronIcon = getCryptoCurrencyIcon(currency);
  return () => <TronIcon color={currency.color} size={18} />;
}
