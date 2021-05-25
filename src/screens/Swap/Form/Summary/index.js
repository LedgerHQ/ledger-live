// @flow

import React, { useCallback, useState } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import IconAD from "react-native-vector-icons/dist/AntDesign";
import { SwapGenericAPIError } from "@ledgerhq/live-common/lib/errors";
import { useTheme } from "@react-navigation/native";
import type { SwapRouteParams } from "..";
import DisclaimerModal from "../DisclaimerModal";
import Button from "../../../../components/Button";
import Confirmation from "../../Confirmation";
import SummaryBody from "./SummaryBody";
import Connect from "../../Connect";
import { ScreenName } from "../../../../const";
import CountdownTimer from "../../../../components/CountdownTimer";
import { Track, TrackScreen } from "../../../../analytics";

const forceInset = { bottom: "always" };

type Props = {
  navigation: any,
  route: {
    params: SwapRouteParams,
  },
};

const SwapFormSummary = ({ navigation, route }: Props) => {
  const {
    exchange,
    exchangeRate,
    transaction,
    status,
    rateExpiration,
  } = route.params;

  const { colors } = useTheme();

  const [confirmed, setConfirmed] = useState(false);
  const [deviceMeta, setDeviceMeta] = useState();
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);
  const reset = useCallback(() => {
    setConfirmed(false);
    setAcceptedDisclaimer(false);
    setDeviceMeta(null);
  }, [setAcceptedDisclaimer, setConfirmed]);

  const onRatesExpired = useCallback(() => {
    if (exchangeRate.tradeMethod === "fixed") {
      reset();
      navigation.navigate(ScreenName.SwapError, {
        error: new SwapGenericAPIError(),
      });
    }
  }, [exchangeRate.tradeMethod, navigation, reset]);

  const showDeviceConnect = confirmed && acceptedDisclaimer && !deviceMeta;
  const padding = showDeviceConnect ? 0 : 16;

  return status && transaction ? (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
          padding,
        },
      ]}
      forceInset={forceInset}
    >
      <TrackScreen category="Swap" name="Summary" />
      {!showDeviceConnect ? (
        <SummaryBody
          exchange={exchange}
          exchangeRate={exchangeRate}
          status={status}
        />
      ) : (
        <Connect setResult={setDeviceMeta} />
      )}

      {confirmed ? (
        acceptedDisclaimer && deviceMeta ? (
          <>
            <Track onUpdate event={"SwapAcceptedSummaryDisclaimer"} />
            <Confirmation
              exchange={exchange}
              exchangeRate={exchangeRate}
              status={status}
              transaction={transaction}
              deviceMeta={deviceMeta}
              onError={error => {
                reset();
                navigation.navigate(ScreenName.SwapError, { error });
              }}
              onCancel={reset}
            />
          </>
        ) : !acceptedDisclaimer ? (
          <DisclaimerModal
            provider={exchangeRate.provider}
            onContinue={() => setAcceptedDisclaimer(true)}
            onClose={() => setConfirmed(false)}
          />
        ) : null
      ) : !showDeviceConnect ? (
        <View style={styles.buttonWrapper}>
          {exchangeRate.tradeMethod === "fixed" ? (
            <View
              style={[styles.countdownTimer, { borderColor: colors.smoke }]}
            >
              <IconAD size={14} name="clockcircleo" color={colors.smoke} />
              <View style={{ marginLeft: 9 }}>
                {rateExpiration ? (
                  <CountdownTimer
                    color={colors.smoke}
                    end={rateExpiration}
                    callback={onRatesExpired}
                  />
                ) : null}
              </View>
            </View>
          ) : null}
          <Button
            event="SwapSummaryConfirm"
            type={"primary"}
            disabled={confirmed}
            title={<Trans i18nKey="transfer.swap.form.button" />}
            onPress={() => setConfirmed(true)}
            containerStyle={styles.button}
          />
        </View>
      ) : null}
    </SafeAreaView>
  ) : null;
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 16,
    paddingTop: 32,
  },
  buttonWrapper: {
    flex: 1,
    justifyContent: "flex-end",
  },
  button: {
    width: "100%",
  },
  countdownTimer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "solid",
    paddingVertical: 2,
    paddingHorizontal: 12,
    minWidth: 90,
    alignSelf: "center",
    marginBottom: 40,
  },
});

export default SwapFormSummary;
