// @flow
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { Trans } from "react-i18next";

import LText from "../../../components/LText";
import WarningBox from "../../../components/WarningBox";

export const ExternalControllerUnsupportedWarning = ({
  address,
  onOpenExplorer,
  onLearnMore,
}: {
  address: ?string,
  onOpenExplorer: Function,
  onLearnMore: Function,
}) => (
  <WarningBox onLearnMore={onLearnMore}>
    <Trans
      i18nKey="polkadot.nomination.externalControllerUnsupported"
      values={{ address }}
    >
      <LText style={styles.text}>
        <TouchableOpacity>
          <LText
            color="live"
            onPress={() => onOpenExplorer(address)}
            numberOfLines={1}
          />
        </TouchableOpacity>
      </LText>
      <LText style={styles.text} />
    </Trans>
  </WarningBox>
);
export const ExternalStashUnsupportedWarning = ({
  address,
  onOpenExplorer,
  onLearnMore,
}: {
  address: ?string,
  onOpenExplorer: Function,
  onLearnMore: Function,
}) => (
  <WarningBox onLearnMore={onLearnMore}>
    <Trans
      i18nKey="polkadot.nomination.externalStashUnsupported"
      values={{ address }}
    >
      <LText style={styles.text}>
        <TouchableOpacity>
          <LText
            color="live"
            onPress={() => onOpenExplorer(address)}
            numberOfLines={1}
          />
        </TouchableOpacity>
      </LText>
      <LText style={styles.text} />
    </Trans>
  </WarningBox>
);

const styles = StyleSheet.create({
  text: {
    fontSize: 14,
  },
});
