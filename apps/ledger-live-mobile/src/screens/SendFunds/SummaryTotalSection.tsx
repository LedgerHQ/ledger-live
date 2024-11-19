import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { Trans } from "react-i18next";
import BigNumber from "bignumber.js";
import SummaryRow from "./SummaryRow";
import CounterValue from "~/components/CounterValue";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import LText from "~/components/LText";
import QueuedDrawer from "~/components/QueuedDrawer";
import Touchable from "~/components/Touchable";
import Info from "~/icons/Info";
import { withTheme, Theme } from "~/colors";
import { GenericInformationBody } from "~/components/GenericInformationBody";
import { InformationFill } from "@ledgerhq/native-ui/assets/icons";
import { useAccountUnit } from "~/hooks/useAccountUnit";

type Props = {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  amount: number | BigNumber;
  colors: Theme["colors"];
};

const SummaryTotalSection = ({ account, amount, colors }: Props) => {
  const [isModalOpened, setIsModalOpened] = useState(false);

  const onRequestClose = () => {
    setIsModalOpened(false);
  };

  const onPress = () => {
    setIsModalOpened(true);
  };

  const unit = useAccountUnit(account);
  const currency = getAccountCurrency(account);

  return (
    <>
      <SummaryRow
        title={<Trans i18nKey="send.summary.total" />}
        additionalInfo={
          <Touchable onPress={onPress} event="SummaryTotalInfo">
            <Info size={12} color={colors.grey} />
          </Touchable>
        }
        titleProps={{
          semiBold: true,
          style: styles.title,
        }}
      >
        <View style={styles.summary}>
          <LText semiBold style={styles.summaryValueText}>
            <CurrencyUnitValue unit={unit} value={amount} disableRounding />
          </LText>
          <LText style={styles.summaryCounterValueText} color="grey">
            <CounterValue value={amount} currency={currency} showCode before="≈ " />
          </LText>
        </View>
      </SummaryRow>
      <QueuedDrawer isRequestingToBeOpened={isModalOpened} onClose={onRequestClose}>
        <GenericInformationBody
          Icon={InformationFill}
          iconColor={"primary.c80"}
          title={<Trans i18nKey="send.summary.infoTotalTitle" />}
          description={<Trans i18nKey="send.summary.infoTotalDesc" />}
        />
      </QueuedDrawer>
    </>
  );
};

const styles = StyleSheet.create({
  summary: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-end",
  },
  title: {},
  summaryValueText: {
    fontSize: 18,
  },
  summaryCounterValueText: {
    fontSize: 14,
  },
});

export default withTheme(React.memo(SummaryTotalSection));
