// @flow

import React, { useCallback, useState } from "react";
import { View, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
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
import CurrencyUnitValue from "../../components/CurrencyUnitValue";

type Props = {
  account: Account,
};

type InfoName = "available" | "delegated" | "undelegating";

function AccountBalanceSummaryFooter({ account }: Props) {
  const [infoName, setInfoName] = useState<InfoName | typeof undefined>();
  const info = useInfo();

  const { spendableBalance, cosmosResources } = account;
  const { delegatedBalance, unboundingBalance } = cosmosResources || {};

  const unit = getAccountUnit(account);

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
        data={infoName ? info[infoName] : []}
      />

      <InfoItem
        title={<Trans i18nKey="account.availableBalance" />}
        onPress={onPressInfoCreator("available")}
        value={<CurrencyUnitValue unit={unit} value={spendableBalance} />}
      />
      <InfoItem
        title={<Trans i18nKey="account.delegatedAssets" />}
        onPress={onPressInfoCreator("delegated")}
        value={<CurrencyUnitValue unit={unit} value={delegatedBalance} />}
      />
      <InfoItem
        title={<Trans i18nKey="account.undelegating" />}
        onPress={onPressInfoCreator("undelegating")}
        value={<CurrencyUnitValue unit={unit} value={unboundingBalance} />}
      />
    </ScrollView>
  );
}

export default function AccountBalanceFooter({ account }: Props) {
  if (!account.cosmosResources) return null;

  return <AccountBalanceSummaryFooter account={account} />;
}

type InfoItemProps = {
  onPress: () => void,
  title: React$Node,
  value: React$Node,
};

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
    backgroundColor: colors.lightFog,
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

function useInfo(): { [key: InfoName]: ModalInfo[] } {
  const currency = getCryptoCurrencyById("cosmos");
  const CosmosIcon = getCryptoCurrencyIcon(currency);
  invariant(CosmosIcon, "Icon is expected");

  return {
    available: [
      {
        Icon: () => <CosmosIcon color={currency.color} size={18} />,
        title: <Trans i18nKey="cosmos.info.available.title" />,
        description: <Trans i18nKey="cosmos.info.available.description" />,
      },
    ],
    delegated: [
      {
        title: <Trans i18nKey="cosmos.info.delegated.title" />,
        description: <Trans i18nKey="cosmos.info.delegated.description" />,
      },
    ],
    undelegating: [
      {
        title: <Trans i18nKey="cosmos.info.undelegating.title" />,
        description: <Trans i18nKey="cosmos.info.undelegating.description" />,
      },
    ],
  };
}
