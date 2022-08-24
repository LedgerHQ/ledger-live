import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useTranslation } from "react-i18next";
import {
  getMainAccount,
  getAccountUnit,
  getAccountCurrency,
} from "@ledgerhq/live-common/account/index";
import { useTheme } from "@react-navigation/native";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import LText from "./LText";
import SummaryRow from "../screens/SendFunds/SummaryRow";
import CheckBox from "./CheckBox";
import CounterValue from "./CounterValue";
import CurrencyUnitValue from "./CurrencyUnitValue";
import SectionSeparator from "./SectionSeparator";
import BottomModal from "./BottomModal";
import Info from "../icons/Info";
import NetworkFeeInfo from "./NetworkFeeInfo";

type Props = {
  strategies: any;
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  onStrategySelect: (..._: Array<any>) => any;
  onCustomFeesPress: (..._: Array<any>) => any;
  forceUnitLabel?: any;
  disabledStrategies?: Array<string>;
};

const CVWrapper = ({ children }: { children: any }) => (
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
  const { t } = useTranslation();
  const { colors } = useTheme();
  const mainAccount = getMainAccount(account, parentAccount);
  const currency = getAccountCurrency(mainAccount);
  const unit = getAccountUnit(mainAccount);
  const { feesStrategy } = transaction;
  const [isNetworkFeeHelpOpened, setNetworkFeeHelpOpened] = useState(false);
  const toggleNetworkFeeHelpModal = useCallback(
    () => setNetworkFeeHelpOpened(!isNetworkFeeHelpOpened),
    [isNetworkFeeHelpOpened],
  );

  const closeNetworkFeeHelpModal = () => setNetworkFeeHelpOpened(false);

  const onPressStrategySelect = useCallback(
    (item: any) => {
      onStrategySelect({
        amount: item.amount,
        label: item.forceValueLabel ?? item.label,
        userGasLimit: item.userGasLimit,
      });
    },
    [onStrategySelect],
  );

  const renderItem = ({ item }) => (
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
          <CheckBox
            onChange={() => onPressStrategySelect(item)}
            style={styles.checkbox}
            isChecked={feesStrategy === item.label}
          />
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
      <BottomModal
        id="NetworkFee"
        isOpened={isNetworkFeeHelpOpened}
        preventBackdropClick={false}
        onClose={closeNetworkFeeHelpModal}
      >
        <NetworkFeeInfo onClose={closeNetworkFeeHelpModal} />
      </BottomModal>

      <View>
        <SectionSeparator lineColor={colors.lightFog} />
        <SummaryRow
          onPress={toggleNetworkFeeHelpModal}
          title={t("send.summary.fees")}
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
  checkbox: {
    borderRadius: 24,
    width: 20,
    height: 20,
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
