// @flow

import React, { useCallback, useState } from "react";

import { useTheme } from "@react-navigation/native";
import { Trans, useTranslation } from "react-i18next";
import { StyleSheet, View, TouchableOpacity } from "react-native";

import BottomModal from "../../components/BottomModal";
import Checkbox from "../../components/CheckBox";
import Button from "../../components/Button";
import LiveIcon from "../../icons/LiveLogo";
import LText from "../../components/LText";
import InfoIcon from "../../icons/Info";
import { rgba } from "../../colors";
import AppIcon from "./AppIcon";

export type Props = {
  closeDisclaimer: () => void,
  disableDisclaimer: () => void,
  onContinue: () => void,
  isOpened: boolean,
  icon?: string | null,
};

const DAppDisclaimer = ({
  closeDisclaimer,
  isOpened,
  disableDisclaimer,
  onContinue: next,
  icon,
}: Props) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [
    disableDisclaimerChecked,
    setDisableDisclaimerChecked,
  ] = useState<boolean>(false);

  const onClose = useCallback(() => {
    closeDisclaimer();
  }, [closeDisclaimer]);
  const onContinue = useCallback(() => {
    if (disableDisclaimerChecked) {
      disableDisclaimer();
    }
    closeDisclaimer();
    next();
  }, [disableDisclaimerChecked, closeDisclaimer, disableDisclaimer, next]);

  return (
    <BottomModal
      style={{
        ...styles.root,
        backgroundColor: colors.card,
      }}
      isOpened={isOpened}
      onClose={onClose}
    >
      <View style={[styles.flowRow, styles.head]}>
        <View style={[styles.headElements, styles.roundLogoContainer]}>
          <LiveIcon size={31} color="blue" />
        </View>
        {icon && (
          <>
            <View style={[styles.headElements, styles.flowRow]}>
              {Array(6)
                .fill()
                .map((_, i) => (
                  <View
                    key={i}
                    style={{ ...styles.dash, backgroundColor: colors.live }}
                  />
                ))}
            </View>
            <View style={styles.headElements}>
              <AppIcon size={48} icon={icon} />
            </View>
          </>
        )}
      </View>

      <LText semiBold style={[styles.textCenter, styles.title]}>
        <Trans i18nKey={"platform.disclaimer.title"} />
      </LText>
      <LText style={[styles.textCenter, styles.description]}>
        <Trans i18nKey={"platform.disclaimer.description"} />
      </LText>

      <View
        style={{
          ...styles.flowRow,
          ...styles.blueInfo,
          backgroundColor: rgba(colors.live, 0.1),
        }}
      >
        <View style={styles.blueInfoIcon}>
          <InfoIcon color={colors.live} size={18} />
        </View>
        <LText style={{ ...styles.blueInfoText, color: colors.live }}>
          <Trans i18nKey={"platform.disclaimer.legalAdvice"} />
        </LText>
      </View>

      <TouchableOpacity
        style={[styles.flowRow, styles.reminder]}
        onPress={() => setDisableDisclaimerChecked(!disableDisclaimerChecked)}
      >
        <Checkbox
          style={styles.checkbox}
          iconCheckSize={12}
          isChecked={disableDisclaimerChecked}
        />
        <LText semibold style={styles.reminderText}>
          <Trans i18nKey={"platform.disclaimer.checkbox"} />
        </LText>
      </TouchableOpacity>

      <View style={styles.buttonContainer}>
        <Button
          type="primary"
          title={t("platform.disclaimer.CTA")}
          onPress={onContinue}
        />
      </View>
    </BottomModal>
  );
};

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 16,
    paddingVertical: 30,
    position: "relative",
  },
  textCenter: {
    textAlign: "center",
  },
  flowRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  head: {
    marginBottom: 32,
  },
  headElements: {
    marginHorizontal: 4,
  },
  dash: {
    height: 2,
    width: 3,
    backgroundColor: "black",
    marginHorizontal: 2,
    opacity: 0.5,
  },
  roundLogoContainer: {
    width: 48,
    height: 48,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: "#ECECEC",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginBottom: 8,
    fontSize: 16,
  },
  description: {
    marginVertical: 8,
    opacity: 0.6,
    lineHeight: 20,
  },
  blueInfo: {
    padding: 12,
    marginVertical: 8,
    borderRadius: 4,
  },
  blueInfoIcon: {
    width: 24,
    marginRight: 6,
    alignItems: "center",
  },
  blueInfoText: {
    flex: 1,
    marginLeft: 6,
    lineHeight: 20,
  },
  reminder: {
    justifyContent: "flex-start",
    marginTop: 24,
    marginBottom: 8,
  },
  checkbox: {
    borderRadius: 4,
    width: 18,
    height: 18,
  },
  reminderText: {
    fontSize: 13,
    paddingLeft: 8,
  },
  buttonContainer: {
    marginTop: 8,
  },
});

export default DAppDisclaimer;
