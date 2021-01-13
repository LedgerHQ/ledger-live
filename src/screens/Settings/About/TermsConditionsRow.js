/* @flow */
import React, { memo, useState, useCallback } from "react";
import { Trans } from "react-i18next";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import SettingsRow from "../../../components/SettingsRow";
import { TermModals } from "../../../components/RequireTerms";
import ExternalLink from "../../../icons/ExternalLink";

const TermsConditionsRow = () => {
  const { colors } = useTheme();
  const [isOpened, open] = useState(false);

  const onOpen = useCallback(() => open(true), [open]);
  const onClose = useCallback(() => open(false), [open]);

  return (
    <>
      <SettingsRow
        event="TermsConditionsRow"
        title={<Trans i18nKey="settings.about.termsConditions" />}
        desc={<Trans i18nKey="settings.about.termsConditionsDesc" />}
        onPress={onOpen}
        alignedTop
      >
        <View style={styles.externalLinkContainer}>
          <ExternalLink size={16} color={colors.grey} />
        </View>
      </SettingsRow>
      <TermModals isOpened={isOpened} close={onClose} />
    </>
  );
};

const styles = StyleSheet.create({
  externalLinkContainer: { marginHorizontal: 10 },
});

const MemoTermsConditionsRow: React$ComponentType<{}> = memo(
  TermsConditionsRow,
);

export default MemoTermsConditionsRow;
