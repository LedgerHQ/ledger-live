import React, { useCallback } from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";
import { useTheme } from "@react-navigation/native";
import { ScreenName } from "~/const";
import LText from "~/components/LText";
import Button from "~/components/wrappedUi/Button";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { AleoViewKeyFlowParamList } from "./types";

type Props = StackNavigatorProps<AleoViewKeyFlowParamList, ScreenName.AleoViewKeyConfirmation>;

export default function AleoViewKeyConfirmationScreen({ route }: Props) {
  const { colors } = useTheme();

  const onBack = useCallback(() => {
    route.params.onCancelFlow();
  }, [route.params]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <LText semiBold style={styles.title}>
          Confirmation
        </LText>
        <LText secondary style={styles.description}>
          View key sharing is handled directly during the approval step. You can go back to account
          discovery from here.
        </LText>
      </View>
      <View style={styles.footer}>
        <Button type="shade" onPress={onBack} event="AleoAddAccountViewKeyConfirmationBack">
          Back
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
    rowGap: 12,
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
  },
  footer: {
    padding: 16,
  },
});
