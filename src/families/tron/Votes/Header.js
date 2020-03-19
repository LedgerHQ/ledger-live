// @flow

import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Trans } from "react-i18next";
import LText from "../../../components/LText";
import Close from "../../../icons/Close";
import colors from "../../../colors";
import Button from "../../../components/Button";
import ProgressCircle from "../../../components/ProgressCircle";

type Props = {
  total: number,
  used: number,
  count: number,
  onPress: () => void,
};

const Header = ({ total, used, count }: Props) => {
  const percentVotesUsed = used / total;

  return (
    <>
      <View style={styles.root}>
        <LText style={styles.title} semiBold>
          <Trans i18nKey="tron.voting.header" values={{ total: count }} />
        </LText>
        <Button
          containerStyle={{ flexGrow: 0.5 }}
          type="lightSecondary"
          event="TronManageVotes"
          onPress={() => {
            /** @TODO redirect to voting flow */
          }}
          title={<Trans i18nKey="tron.voting.manageVotes" />}
        />
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
    paddingVertical: 8,
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
  cta: {
    flex: 1,
    flexGrow: 0.5,
  },
  label: {
    fontSize: 18,
    color: colors.darkBlue,
    marginRight: 6,
  },
  title: {
    flex: 1,
    fontSize: 18,
    lineHeight: 22,
    textAlign: "left",
    paddingVertical: 4,
    color: colors.darkBlue,
  },
  closeButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default Header;
