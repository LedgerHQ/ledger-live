import React, { useCallback } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { ScreenName } from "~/const";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import CantonDisclaimer from "./CantonDisclaimer";
import type { CantonOnboardAccountParamList } from "./types";

type Props = StackNavigatorProps<CantonOnboardAccountParamList, ScreenName.CantonDisclaimer>;

export default function CantonDisclaimerScreen({ navigation, route }: Props) {
  const handleAgree = useCallback(() => {
    navigation.replace(ScreenName.CantonOnboardAccount, route.params);
  }, [navigation, route.params]);

  const handleCancel = useCallback(() => {
    navigation.getParent()?.goBack();
  }, [navigation]);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <CantonDisclaimer onAgree={handleAgree} onCancel={handleCancel} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingTop: 16,
    paddingBottom: 24,
  },
});
