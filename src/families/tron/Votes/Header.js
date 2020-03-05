// @flow

import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Trans } from "react-i18next";
import LText from "../../../components/LText";
import Check from "../../../icons/Check";
import Close from "../../../icons/Close";
import colors from "../../../colors";
import ProgressCircle from "../../../components/ProgressCircle";

type Props = {
  total: number,
  used: number,
  onPress: () => void,
};

const Header = ({ total, used }: Props) => {
  const percentVotesUsed = used / total;

  return (
    <>
      <View style={styles.root}>
        <LText style={styles.title} semiBold>
          <Trans i18nKey="tron.voting.header" />
        </LText>
        {percentVotesUsed >= 1 && (
          <View style={styles.labelContainer}>
            <Check size={12} color={colors.grey} />
            <LText style={styles.label}>
              <Trans i18nKey="tron.voting.allVotesUsed" />
            </LText>
          </View>
        )}
      </View>
      {percentVotesUsed < 1 && (
        <View style={[styles.root, styles.warn]}>
          <ProgressCircle
            size={76}
            progress={percentVotesUsed}
            backgroundColor={colors.fog}
          />
          <View style={styles.warnSection}>
            <LText semiBold style={[styles.title, styles.warnText]}>
              <Trans
                i18nKey="tron.voting.remainingVotes.title"
                values={{ amount: total - used }}
              />
            </LText>
            <LText style={[styles.label, styles.warnText]}>
              <Trans i18nKey="tron.voting.remainingVotes.description" />
            </LText>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              /** @TODO close action */
            }}
          >
            <Close size={10} color={colors.live} />
          </TouchableOpacity>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightFog,
  },
  warn: {
    backgroundColor: colors.lightFog,
    padding: 8,
  },
  warnSection: {
    flexDirection: "column",
    flex: 1,
    marginHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  warnText: {
    color: colors.live,
    marginLeft: 0,
  },
  title: {
    fontSize: 14,
    lineHeight: 16,
    color: colors.darkBlue,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    flex: 1,
  },
  label: {
    fontSize: 13,
    color: colors.grey,
    marginLeft: 6,
  },
  closeButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default Header;
