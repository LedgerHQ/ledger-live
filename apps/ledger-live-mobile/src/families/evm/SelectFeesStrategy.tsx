import { isStrategyDisabled } from "@ledgerhq/coin-evm/editTransaction/index";
import { getEstimatedFees } from "@ledgerhq/coin-evm/logic";
import { getTypedTransaction } from "@ledgerhq/coin-evm/transaction";
import type { FeeData, GasOptions, Strategy, Transaction } from "@ledgerhq/coin-evm/types/index";
import { getFeesCurrency, getFeesUnit, getMainAccount } from "@ledgerhq/live-common/account/index";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { useTheme } from "@react-navigation/native";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  ListRenderItemInfo,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from "react-native";
import { useAnalytics } from "~/analytics";
import CounterValue from "~/components/CounterValue";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import LText from "~/components/LText";
import NetworkFeeInfo from "~/components/NetworkFeeInfo";
import QueuedDrawer from "~/components/QueuedDrawer";
import SectionSeparator from "~/components/SectionSeparator";
import Info from "~/icons/Info";
import TachometerFast from "~/icons/TachometerFast";
import TachometerMedium from "~/icons/TachometerMedium";
import TachometerSlow from "~/icons/TachometerSlow";
import SummaryRow from "~/screens/SendFunds/SummaryRow";
import { sharedSwapTracking } from "~/screens/Swap/utils";
import { StrategyWithCustom } from "./types";

type Props = {
  gasOptions: GasOptions;
  customFees: BigNumber | null;
  account: AccountLike;
  parentAccount?: Account | null;
  transaction: Transaction;
  onStrategySelect: (_: { feesStrategy: StrategyWithCustom }) => void;
  onCustomFeesPress: TouchableOpacityProps["onPress"];
  forceUnitLabel?: boolean | React.ReactNode;
  disabledStrategies?: Array<string>;
  NetworkFeesInfoComponent?: React.FC;
  transactionToUpdate?: Transaction;
};

const CVWrapper = ({ children }: { children?: React.ReactNode }) => (
  <LText semiBold color="grey">
    {children}
  </LText>
);

const strategies: Strategy[] = ["slow", "medium", "fast"];
const strategiesWithCustom: StrategyWithCustom[] = [...strategies, "custom"];

export default function SelectFeesStrategy({
  gasOptions,
  customFees,
  account,
  parentAccount,
  transaction,
  onStrategySelect,
  onCustomFeesPress,
  forceUnitLabel,
  disabledStrategies,
  NetworkFeesInfoComponent,
  transactionToUpdate,
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
    (strategy: StrategyWithCustom) => {
      track("button_clicked", {
        ...sharedSwapTracking,
        button: strategy,
        page: "Swap quotes",
      });
      onStrategySelect({ feesStrategy: strategy });
    },
    [onStrategySelect, track],
  );

  const renderItem = ({ item: strategy }: ListRenderItemInfo<StrategyWithCustom>) => {
    const estimatedFees = (() => {
      if (strategy === "custom") {
        invariant(customFees, "customFees must be defined when strategy is custom");

        return customFees;
      }

      return getEstimatedFees(getTypedTransaction(transaction, gasOptions[strategy]));
    })();

    const feeData: FeeData =
      strategy === "custom"
        ? {
            maxFeePerGas: transaction.maxFeePerGas ?? null,
            maxPriorityFeePerGas: transaction.maxPriorityFeePerGas ?? null,
            gasPrice: transaction.gasPrice ?? null,
            nextBaseFee: null,
          }
        : gasOptions[strategy];

    const isDisabled =
      disabledStrategies?.includes(strategy) ||
      (!!transactionToUpdate &&
        isStrategyDisabled({
          transaction: transactionToUpdate,
          feeData,
        }));

    const isSelected = feesStrategy === strategy && !isDisabled;

    return (
      <TouchableOpacity
        onPress={() => onPressStrategySelect(strategy)}
        disabled={isDisabled}
        style={[
          styles.feeButton,
          {
            borderColor: isSelected ? colors.live : colors.background,
            backgroundColor: isSelected ? colors.lightLive : colors.lightFog,
          },
        ]}
      >
        <View
          style={[
            styles.feeStrategyContainer,
            {
              opacity: isDisabled ? 0.2 : 1,
            },
          ]}
        >
          <View style={styles.leftBox}>
            {strategy === "slow" ? (
              <TachometerSlow size={16} color={colors.grey} />
            ) : strategy === "medium" ? (
              <TachometerMedium size={16} color={colors.grey} />
            ) : (
              <TachometerFast size={16} color={colors.grey} />
            )}
            <LText semiBold style={styles.feeLabel}>
              {t(`fees.speed.${strategy}`)}
            </LText>
          </View>
          <View style={styles.feesAmountContainer}>
            <LText semiBold style={styles.feesAmount}>
              <CurrencyUnitValue showCode={!forceUnitLabel} unit={unit} value={estimatedFees} />
              {forceUnitLabel ? " " : null}
              {forceUnitLabel || null}
            </LText>

            <CounterValue
              currency={currency}
              showCode
              value={estimatedFees}
              alwaysShowSign={false}
              withPlaceholder
              Wrapper={CVWrapper}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <QueuedDrawer
        isRequestingToBeOpened={isNetworkFeeHelpOpened}
        preventBackdropClick={false}
        onClose={closeNetworkFeeHelpModal}
      >
        {NetworkFeesInfoComponent ? <NetworkFeesInfoComponent /> : <NetworkFeeInfo />}
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
            data={customFees ? strategiesWithCustom : strategies}
            renderItem={renderItem}
            keyExtractor={s => s}
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
