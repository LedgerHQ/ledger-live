// @flow
import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { Trans } from "react-i18next";
import colors from "../../../colors";
import { ScreenName } from "../../../const";
import Button from "../../../components/Button";
import LText from "../../../components/LText";
import IlluVotes from "../IlluVotes";

type Props = {
  navigation: any,
  route: { params: {} },
};

function VoteStarted({ navigation, route }: Props) {
  const onNext = useCallback(() => {
    navigation.replace(ScreenName.VoteSelectValidator, route.params);
  }, [navigation, route.params]);

  const onCancel = useCallback(() => {
    navigation.dangerouslyGetParent().pop();
  }, [navigation]);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.main}>
        <IlluVotes />

        <LText style={styles.description}>
          <Trans i18nKey="tron.voting.flow.started.description" />
        </LText>
      </View>

      <View style={styles.footer}>
        <Button
          event="VoteStartedContinueBtn"
          onPress={onNext}
          title={<Trans i18nKey="tron.voting.flow.started.button.continue" />}
          type="primary"
        />
        <Button
          event="VoteStartedCancelBtn"
          onPress={onCancel}
          title={<Trans i18nKey="common.cancel" />}
          type="secondary"
          outline={false}
          containerStyle={styles.buttonContainer}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 16,
  },
  main: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.grey,
    textAlign: "center",
    marginVertical: 16,
  },
  footer: {
    alignSelf: "stretch",
  },
  buttonContainer: {
    marginTop: 4,
  },
  howVotingWorks: {
    marginTop: 32,
    borderRadius: 32,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.live,
    flexDirection: "row",
  },
});

export default VoteStarted;
