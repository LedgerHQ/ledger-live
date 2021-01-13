// @flow
import React from "react";
import { Linking, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import Icon from "react-native-vector-icons/dist/AntDesign";
import { useTheme } from "@react-navigation/native";
import Circle from "../../../components/Circle";
import BottomModal from "../../../components/BottomModal";
import ExternalLink from "../../../components/ExternalLink";
import LText from "../../../components/LText";
import Button from "../../../components/Button";
import { urls } from "../../../config/urls";

const DisclaimerModal = ({
  onClose,
  onContinue,
  provider,
}: {
  onClose: () => void,
  onContinue: () => void,
  provider: string,
}) => {
  const { colors } = useTheme();
  return (
    <BottomModal
      id="SwapDisclaimerModal"
      isOpened={true}
      onClose={undefined}
      style={styles.root}
    >
      <Circle bg={colors.pillActiveBackground} size={40}>
        <Icon name="exclamationcircleo" color={colors.live} size={22} />
      </Circle>
      <LText style={styles.title}>
        <Trans i18nKey={"transfer.swap.form.summary.disclaimer.title"} />
      </LText>
      <LText style={styles.desc} color="smoke">
        <Trans
          i18nKey={"transfer.swap.form.summary.disclaimer.desc"}
          values={{ provider }}
        />
      </LText>
      <ExternalLink
        text={<Trans i18nKey="transfer.swap.form.summary.disclaimer.tos" />}
        onPress={() => Linking.openURL(urls.swap.providers[provider].tos)}
        event="OpenTerms"
      />
      <Button
        containerStyle={[styles.button, styles.firstButton]}
        onPress={onContinue}
        type={"primary"}
        event={"SwapAcceptSummaryDisclaimer"}
        title={
          <Trans i18nKey={`transfer.swap.form.summary.disclaimer.accept`} />
        }
      />
      <Button
        containerStyle={styles.button}
        outline={false}
        onPress={onClose}
        type={"secondary"}
        event={"SwaprejectSummaryDisclaimer"}
        title={
          <Trans i18nKey={`transfer.swap.form.summary.disclaimer.reject`} />
        }
      />
    </BottomModal>
  );
};

const styles = StyleSheet.create({
  root: {
    padding: 16,
    paddingBottom: 0,
    alignItems: "center",
  },
  title: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 18,
    lineHeight: 22,
  },
  desc: {
    marginBottom: 16,
    marginTop: 8,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 18,
  },
  button: {
    marginTop: 8,
    width: "100%",
  },
  firstButton: {
    marginTop: 24,
  },
});

export default DisclaimerModal;
