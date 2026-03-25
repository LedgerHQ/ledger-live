import React from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "@ledgerhq/native-ui";
import { Trans } from "react-i18next";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { ICP_FEES } from "@ledgerhq/live-common/families/internet_computer/consts";
import { BigNumber } from "bignumber.js";
import { Unit } from "@ledgerhq/types-cryptoassets";
import { formatAddress } from "LLM/features/Accounts/utils/formatAddress";

type Props = {
  neuronId: string;
  unit: Unit;
  additionalInfo?: Array<{
    labelKey: string;
    value: string | React.ReactNode;
  }>;
};

export default function NeuronInfoCard({ neuronId, unit, additionalInfo }: Props) {
  return (
    <View style={styles.infoCard}>
      <View style={styles.infoRow}>
        <Text variant="body" color="neutral.c70">
          <Trans i18nKey="icp.neuronManage.action.neuronId" />
        </Text>
        <Text variant="body" fontWeight="semiBold" numberOfLines={1} style={styles.neuronIdText}>
          {formatAddress(neuronId)}
        </Text>
      </View>

      {additionalInfo?.map((info, index) => (
        <View key={index} style={styles.infoRow}>
          <Text variant="body" color="neutral.c70">
            <Trans i18nKey={info.labelKey} />
          </Text>
          <Text variant="body" fontWeight="semiBold">
            {info.value}
          </Text>
        </View>
      ))}

      <View style={styles.infoRow}>
        <Text variant="body" color="neutral.c70">
          <Trans i18nKey="icp.neuronManage.action.fee" />
        </Text>
        <Text variant="body" fontWeight="semiBold">
          {formatCurrencyUnit(unit, new BigNumber(ICP_FEES), { showCode: true })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  infoCard: {
    borderRadius: 8,
    padding: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  neuronIdText: {
    maxWidth: 150,
  },
});
