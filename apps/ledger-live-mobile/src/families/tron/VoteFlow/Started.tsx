import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { ScreenName } from "../../../const";
import Button from "../../../components/Button";
import LText from "../../../components/LText";
import IlluVotes from "../IlluVotes";
import {
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "../../../components/RootNavigator/types/helpers";
import { TronVoteFlowParamList } from "./types";
import { BaseNavigatorStackParamList } from "../../../components/RootNavigator/types/BaseNavigator";

// FIXME: SUPPOSED TO BE A BaseComposite<> HOWEVER
// THE navigation.replace IS BEING STUBBORN, SO CHEATING
// HERE BECAUSE WE SHARE ScreenNames BETWEEN DIFFERENT NAVIGATOR
// (I BELIEVE THIS IS THE ISSUE)
type Props = StackNavigatorProps<TronVoteFlowParamList, ScreenName.VoteStarted>;

function VoteStarted({ navigation, route }: Props) {
  const { colors } = useTheme();
  const onNext = useCallback(() => {
    navigation.replace(ScreenName.VoteSelectValidator, {
      ...route.params,
    });
  }, [navigation, route.params]);
  const onCancel = useCallback(() => {
    navigation
      .getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>()
      .pop();
  }, [navigation]);
  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <View style={styles.main}>
        <IlluVotes />

        <LText style={styles.description} color="grey">
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
    textAlign: "center",
    marginVertical: 16,
  },
  footer: {
    alignSelf: "stretch",
  },
  buttonContainer: {
    marginTop: 4,
  },
});
export default VoteStarted;
