import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TouchableOpacityProps,
  SafeAreaView,
  ListRenderItemInfo,
} from "react-native";
import { useTranslation } from "react-i18next";
import {
  getMainAccount,
  getFeesCurrency,
  getFeesUnit,
} from "@ledgerhq/live-common/account/index";
import { useTheme } from "@react-navigation/native";
import type { Account, AccountLike, FeeStrategy } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import BigNumber from "bignumber.js";
import LText from "./LText";
import SummaryRow from "../screens/SendFunds/SummaryRow";
import CounterValue from "./CounterValue";
import CurrencyUnitValue from "./CurrencyUnitValue";
import SectionSeparator from "./SectionSeparator";
import QueuedDrawer from "./QueuedDrawer";
import Info from "../icons/Info";
import TachometerSlow from "../icons/TachometerSlow";
import TachometerMedium from "../icons/TachometerMedium";
import TachometerFast from "../icons/TachometerFast";
import NetworkFeeInfo from "./NetworkFeeInfo";
import { useAnalytics } from "../analytics";
import { sharedSwapTracking } from "../screens/Swap/utils";

type Props = {
  strategies: (FeeStrategy & { userGasLimit?: BigNumber })[];
  account: AccountLike;
  parentAccount?: Account | null;
  transaction: Transaction;
  onStrategySelect: (_: FeeStrategy & { userGasLimit?: BigNumber }) => void;
  onCustomFeesPress: TouchableOpacityProps["onPress"];
  forceUnitLabel?: boolean | React.ReactNode;
  disabledStrategies?: Array<string>;
};

const CVWrapper = ({ children }: { children?: React.ReactNode }) => (
  <LText semiBold color="grey">
    {children}
  </LText>
);

export default function SelectFeesStrategy({
  strategies,
  account,
  parentAccount,
  transaction,
  onStrategySelect,
  onCustomFeesPress,
  forceUnitLabel,
  disabledStrategies,
}: Props) {
  const { track } = useAnalytics();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const mainAccount = getMainAccount(account, parentAccount);
  const currency = getFeesCurrency(mainAccount);
  const unit = getFeesUnit(currency);
  const { feesStrategy } = transaction;
  const [isNetworkFeeHelpOpened, setNetworkFeeHelpOpened] = useState(false);
  const toggleNetworkFeeHelpModal = useCallback(
    () => setNetworkFeeHelpOpened(!isNetworkFeeHelpOpened),
    [isNetworkFeeHelpOpened],
  );

  const closeNetworkFeeHelpModal = () => setNetworkFeeHelpOpened(false);

  const onPressStrategySelect = useCallback(
    (item: FeeStrategy) => {
      track("button_clicked", {
        ...sharedSwapTracking,
        button: item.label,
        page: "Swap quotes",
      });
      onStrategySelect({
        amount: item.amount,
        label:
          (item as { forceValueLabel?: string }).forceValueLabel ?? item.label,
        userGasLimit: (item as { userGasLimit?: BigNumber }).userGasLimit,
        txParameters: item.txParameters,
      });
    },
    [onStrategySelect, track],
  );

  const renderItem = ({ item }: ListRenderItemInfo<FeeStrategy>) => (
    <TouchableOpacity
      onPress={() => onPressStrategySelect(item)}
      disabled={
        disabledStrategies ? disabledStrategies.includes(item.label) : false
      }
      style={[
        styles.feeButton,
        {
          borderColor:
            feesStrategy === item.label ? colors.live : colors.background,
          backgroundColor:
            feesStrategy === item.label ? colors.lightLive : colors.lightFog,
        },
      ]}
    >
      <View
        style={[
          styles.feeStrategyContainer,
          {
            opacity: disabledStrategies?.includes(item.label) ? 0.2 : 1,
          },
        ]}
      >
        <View style={styles.leftBox}>
          {item.label === "slow" ? (
            <TachometerSlow size={16} color={colors.grey} />
          ) : item.label === "medium" ? (
            <TachometerMedium size={16} color={colors.grey} />
          ) : (
            <TachometerFast size={16} color={colors.grey} />
          )}
          <LText semiBold style={styles.feeLabel}>
            {t(`fees.speed.${item.label}`)}
          </LText>
        </View>
        <View style={styles.feesAmountContainer}>
          <LText semiBold style={styles.feesAmount}>
            <CurrencyUnitValue
              showCode={!forceUnitLabel}
              unit={item.unit ?? unit}
              value={item.displayedAmount ?? item.amount}
            />
            {forceUnitLabel ? " " : null}
            {forceUnitLabel || null}
          </LText>
          {item.displayedAmount ? (
            <CounterValue
              currency={currency}
              showCode
              value={item.displayedAmount}
              alwaysShowSign={false}
              withPlaceholder
              Wrapper={CVWrapper}
            />
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <QueuedDrawer
        isRequestingToBeOpened={isNetworkFeeHelpOpened}
        preventBackdropClick={false}
        onClose={closeNetworkFeeHelpModal}
      >
        <NetworkFeeInfo />
      </QueuedDrawer>

      <View>
        <SectionSeparator lineColor={colors.lightFog} />
        <SummaryRow
          onPress={toggleNetworkFeeHelpModal}
          title={t("send.summary.maxEstimatedFee")}
          additionalInfo={
            <View>
              <Info size={12} color={colors.grey} />
            </View>
          }
        >
          {null}
        </SummaryRow>

        <SafeAreaView style={styles.strategiesContainer}>
          <FlatList
            data={strategies}
            renderItem={renderItem}
            keyExtractor={s => s.label}
            extraData={feesStrategy}
          />
        </SafeAreaView>
        <TouchableOpacity
          style={[
            styles.customizeFeesButton,
            {
              backgroundColor: colors.lightLive,
            },
          ]}
          onPress={onCustomFeesPress}
        >
          <LText semiBold color="live">
            {t("send.summary.customizeFees")}
          </LText>
        </TouchableOpacity>
      </View>
    </>
  );
}
const styles = StyleSheet.create({
  strategiesContainer: {
    flex: 1,
  },
  leftBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  feeStrategyContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  feesAmountContainer: {
    alignItems: "flex-end",
  },
  feeButton: {
    width: "100%",
    borderRadius: 4,
    borderWidth: 1,
    marginVertical: 4,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  feeLabel: {
    fontSize: 16,
    textTransform: "capitalize",
    marginLeft: 10,
  },
  feesAmount: {
    fontSize: 15,
  },
  customizeFeesButton: {
    flex: 1,
    padding: 8,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 16,
  },
});
