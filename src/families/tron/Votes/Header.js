// @flow

import React from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import LText from "../../../components/LText";
import colors from "../../../colors";
import Button from "../../../components/Button";

type Props = {
  count: number,
  onPress: () => void,
};

const Header = ({ count, onPress }: Props) => {
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
          onPress={onPress}
          title={<Trans i18nKey="tron.voting.manageVotes" />}
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  title: {
    flex: 1,
    fontSize: 18,
    lineHeight: 22,
    textAlign: "left",
    paddingVertical: 4,
    color: colors.darkBlue,
  },
});

export default Header;
