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
    deviceMeta,
    rateExpiration,
  } = route.params;

  const { colors } = useTheme();

  const [confirmed, setConfirmed] = useState(false);
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);
  const reset = useCallback(() => {
    setConfirmed(false);
    setAcceptedDisclaimer(false);
  }, [setAcceptedDisclaimer, setConfirmed]);

  const onRatesExpired = useCallback(() => {
    reset();
    navigation.navigate(ScreenName.SwapError, {
      error: new SwapGenericAPIError(),
    });
  }, [navigation, reset]);

  return status && transaction ? (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.background }]}
      forceInset={forceInset}
    >
      <TrackScreen category="Swap" name="Summary" />
      <SummaryBody
        exchange={exchange}
        exchangeRate={exchangeRate}
        status={status}
      />

      {confirmed ? (
        acceptedDisclaimer ? (
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
        ) : (
          <DisclaimerModal
            provider={exchangeRate.provider}
            onContinue={() => setAcceptedDisclaimer(true)}
            onClose={() => setConfirmed(false)}
          />
        )
      ) : (
        <View style={styles.buttonWrapper}>
          <View style={[styles.countdownTimer, { borderColor: colors.smoke }]}>
            <IconAD size={14} name="clockcircleo" color={colors.smoke} />
            <View style={{ marginLeft: 9 }}>
              <CountdownTimer end={rateExpiration} callback={onRatesExpired} />
            </View>
          </View>
          <Button
            event="SwapSummaryConfirm"
            type={"primary"}
            disabled={confirmed}
            title={<Trans i18nKey="transfer.swap.form.button" />}
            onPress={() => setConfirmed(true)}
            containerStyle={styles.button}
          />
        </View>
      )}
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
