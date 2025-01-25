import React from "react";
import { StyleSheet, Animated } from "react-native";
import { Trans } from "react-i18next";

import IconPause from "~/icons/Pause";
import Button from "~/components/Button";

import { ScanDeviceAccountsFooterProps } from "../../types";
import useAnimatedStyle from "./useAnimatedStyle";

const ScanDeviceAccountsFooter = ({
  isDisabled,
  onContinue,
  isScanning,
  onStop,
  canRetry,
  canDone,
  onRetry,
  onDone,
}: ScanDeviceAccountsFooterProps) => {
  const { animatedSelectableAccount } = useAnimatedStyle();

  return (
    <Animated.View style={[styles.footer, animatedSelectableAccount]}>
      {isScanning ? (
        <Button
          event="AddAccountsStopScan"
          type="tertiary"
          title={<Trans i18nKey="addAccounts.stopScanning" />}
          onPress={onStop}
          IconLeft={IconPause}
        />
      ) : canRetry ? (
        <Button
          event="AddAccountsRetryScan"
          type="primary"
          title={<Trans i18nKey="addAccounts.scanDeviceAccounts.retryScanning" />}
          onPress={onRetry}
        />
      ) : canDone ? (
        <Button
          event="AddAccountsDone"
          type="primary"
          title={<Trans i18nKey="addAccounts.done" />}
          onPress={onDone}
        />
      ) : (
        <Button
          testID="add-accounts-continue-button"
          event="AddAccountsSelected"
          type="primary"
          title={<Trans i18nKey="addAccounts.scanDeviceAccounts.confirm" />}
          onPress={isDisabled ? undefined : onContinue}
        />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  footer: {
    padding: 16,
  },
});

export default ScanDeviceAccountsFooter;
