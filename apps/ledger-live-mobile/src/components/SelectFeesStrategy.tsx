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
import { getMainAccount, getFeesCurrency, getFeesUnit } from "@ledgerhq/live-common/account/index";
import { useTheme } from "styled-components/native";
import type {
  Account,
  AccountLike,
  FeeStrategy,
  TransactionStatusCommon,
} from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import BigNumber from "bignumber.js";
import LText from "./LText";
import SummaryRow from "~/screens/SendFunds/SummaryRow";
import CounterValue from "./CounterValue";
import CurrencyUnitValue from "./CurrencyUnitValue";
import SectionSeparator from "./SectionSeparator";
import QueuedDrawer from "./QueuedDrawer";
import Info from "~/icons/Info";
import TachometerSlow from "~/icons/TachometerSlow";
import TachometerMedium from "~/icons/TachometerMedium";
import TachometerFast from "~/icons/TachometerFast";
import NetworkFeeInfo from "./NetworkFeeInfo";
import { useAnalytics } from "~/analytics";
import { sharedSwapTracking } from "~/screens/Swap/utils";
import Alert from "./Alert";
import TranslatedError from "./TranslatedError";
import { useNavigation } from "@react-navigation/core";
import { NavigatorName, ScreenName } from "~/const";
import { Flex, Text } from "@ledgerhq/native-ui";

export type SelectFeeStrategy = FeeStrategy & {
  userGasLimit?: BigNumber;
  forceValueLabel?: string;
};

type Props = {
  strategies: SelectFeeStrategy[];
  account: AccountLike;
  parentAccount?: Account | null;
  transaction: Transaction;
  forceUnitLabel?: boolean | React.ReactNode;
  disabledStrategies?: Array<string>;
  NetworkFeesInfoComponent?: React.FC;
  forceValueLabel?: string;
  onStrategySelect: (stategy: SelectFeeStrategy) => void;
  onCustomFeesPress: TouchableOpacityProps["onPress"];
  status?: TransactionStatusCommon;
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
  forceUnitLabel,
  disabledStrategies,
  NetworkFeesInfoComponent,
  onStrategySelect,
  onCustomFeesPress,
  status,
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
  const navigation = useNavigation();

  const errors = status?.errors;
  const insufficuentError = Object.values(errors || {})[0] || null;

  const closeNetworkFeeHelpModal = () => setNetworkFeeHelpOpened(false);

  const onPressStrategySelect = useCallback(
    (item: SelectFeeStrategy) => {
      track("button_clicked", {
        ...sharedSwapTracking,
        button: item.label,
        page: "Swap quotes",
      });

      onStrategySelect({
        amount: item.amount,
        label: item.forceValueLabel ?? item.label,
        userGasLimit: item.userGasLimit,
        txParameters: item.txParameters,
        extra: item.extra,
      });
    },
    [onStrategySelect, track],
  );

  const onBuy = useCallback(
    (account: Account) => {
      navigation.navigate(NavigatorName.Exchange, {
        screen: ScreenName.ExchangeBuy,
        params: {
          defaultAccountId: account.id,
          defaultCurrencyId: account.currency.id,
        },
      });
    },
    [navigation],
  );

  const renderItem = ({ item }: ListRenderItemInfo<SelectFeeStrategy>) => {
    const isDisabled = disabledStrategies?.includes(item.label);
    const isSelected = feesStrategy === item.label && !isDisabled;

    return (
      <TouchableOpacity
        onPress={() => onPressStrategySelect(item)}
        disabled={isDisabled}
        style={[
          styles.feeButton,
          {
            borderColor: isSelected
              ? insufficuentError
                ? colors.warning.c70
                : colors.primary.c80
              : "transparent",
            backgroundColor: isSelected ? colors.opacityPurple.c10 : colors.opacityDefault.c05,
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
            {item.label === "slow" ? (
              <TachometerSlow size={16} color={colors.opacityDefault.c60} />
            ) : item.label === "medium" ? (
              <TachometerMedium size={16} color={colors.opacityDefault.c60} />
            ) : (
              <TachometerFast size={16} color={colors.opacityDefault.c60} />
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
              {forceUnitLabel ? " " : null}
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
        <SectionSeparator lineColor={colors.opacityDefault.c10} />
        <SummaryRow
          onPress={toggleNetworkFeeHelpModal}
          title={t("send.summary.maxEstimatedFee")}
          additionalInfo={
            <View>
              <Info size={12} color={colors.neutral.c70} />
            </View>
          }
        >
          {null}
        </SummaryRow>
        {insufficuentError && (
          <TouchableOpacity onPress={() => onBuy(mainAccount)}>
            <Alert type="warning">
              <Flex width={"90%"}>
                <Text>
                  <TranslatedError error={insufficuentError} />
                </Text>
              </Flex>
            </Alert>
          </TouchableOpacity>
        )}
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
              backgroundColor: colors.opacityPurple.c10,
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
    borderRadius: 12,
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
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 16,
  },
});
