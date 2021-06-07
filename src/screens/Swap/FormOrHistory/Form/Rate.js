// @flow

import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import { Trans } from "react-i18next";
import Icon from "react-native-vector-icons/FontAwesome5Pro";

import { BigNumber } from "bignumber.js";

import type {
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/live-common/lib/types";

import ClockIcon from "../../../../icons/Clock";
import CurrencyUnitValue from "../../../../components/CurrencyUnitValue";
import CountdownTimer from "../../../../components/CountdownTimer";
import LText from "../../../../components/LText";
import BottomModal from "../../../../components/BottomModal";
import Touchable from "../../../../components/Touchable";

const Rate = ({
  rateExpiration,
  onRatesExpired,
  tradeMethod,
  magnitudeAwareRate,
  fromCurrency,
  toCurrency,
}: {
  rateExpiration: Date,
  onRatesExpired: () => void,
  tradeMethod: "fixed" | "float",
  magnitudeAwareRate: BigNumber,
  fromCurrency: CryptoCurrency | TokenCurrency,
  toCurrency: CryptoCurrency | TokenCurrency,
}) => {
  const { colors } = useTheme();
  const [isModalVisible, setIsModalVisible] = useState(false);

  return (
    <>
      <View style={styles.container}>
        {tradeMethod === "fixed" ? (
          <View style={styles.fixedPositionCountdown}>
            <View style={{ marginRight: 8 }}>
              <ClockIcon color={colors.grey} size={12} />
            </View>
            <CountdownTimer
              color={colors.grey}
              end={rateExpiration}
              callback={onRatesExpired}
            />
          </View>
        ) : null}
        <Touchable
          style={styles.price}
          event="Swap trade method help"
          onPress={() => setIsModalVisible(true)}
        >
          <Icon
            color={colors.grey}
            name={tradeMethod === "fixed" ? "lock" : "lock-open"}
            light
          />
          <LText color={colors.grey} style={styles.price}>
            <CurrencyUnitValue
              value={BigNumber(10).pow(fromCurrency.units[0].magnitude)}
              unit={fromCurrency.units[0]}
              showCode
            />
            {" = "}
            <CurrencyUnitValue
              unit={toCurrency.units[0]}
              value={BigNumber(10)
                .pow(fromCurrency.units[0].magnitude)
                .times(magnitudeAwareRate)}
              showCode
            />
          </LText>
          <View style={{ marginLeft: 8 }}>
            <Icon color={colors.grey} name={"info-circle"} size={12} />
          </View>
        </Touchable>
      </View>
      <BottomModal
        style={styles.modal}
        isOpened={isModalVisible}
        onClose={() => setIsModalVisible(false)}
      >
        <View>
          <LText semiBold style={styles.modalTitle}>
            <Trans i18nKey={"transfer.swap.tradeMethod.modalTitle"} />
          </LText>
          <View style={styles.modalMethod}>
            <Icon
              style={styles.modalIcon}
              color={colors.grey}
              name={"lock-open"}
              size={20}
              light
            />
            <View style={styles.modalDesc}>
              <LText semiBold style={styles.methodTitle}>
                <Trans i18nKey={"transfer.swap.tradeMethod.float"} />
              </LText>
              <LText color="grey" style={styles.method}>
                <Trans i18nKey={"transfer.swap.tradeMethod.floatDesc"} />
              </LText>
            </View>
          </View>
          <View style={styles.modalMethod}>
            <Icon
              style={styles.modalIcon}
              color={colors.grey}
              name={"lock"}
              size={20}
              light
            />
            <View style={styles.modalDesc}>
              <LText semiBold style={styles.methodTitle}>
                <Trans i18nKey={"transfer.swap.tradeMethod.fixed"} />
              </LText>
              <LText color="grey" style={styles.method}>
                <Trans i18nKey={"transfer.swap.tradeMethod.fixedDesc"} />
              </LText>
            </View>
          </View>
        </View>
      </BottomModal>
    </>
  );
};

const styles = StyleSheet.create({
  fixedPositionCountdown: {
    borderRightWidth: 1,
    paddingRight: 10,
    borderColor: "rgba(20, 37, 51, 0.2)",
    width: 70,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  container: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    height: 16,
  },
  price: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginLeft: 8,
    fontSize: 12,
  },
  modal: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  modalIcon: {
    marginRight: 10,
    width: 34,
    overflow: "visible",
  },
  modalMethod: {
    flexDirection: "row",
    alignItems: "center",
    display: "flex",
    padding: 16,
    paddingRight: 32,
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 10,
    textAlign: "center",
  },
  modalDesc: {},
  methodTitle: {
    fontSize: 14,
  },
  method: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
  },
});

export default Rate;
