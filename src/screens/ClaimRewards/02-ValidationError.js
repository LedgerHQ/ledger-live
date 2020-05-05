/* @flow */
import React, { useCallback } from "react";
import { StyleSheet, Linking } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { TrackScreen } from "../../analytics";
import colors from "../../colors";
import { ScreenName } from "../../const";
import ValidateError from "../../components/ValidateError";
import { urls } from "../../config/urls";

const forceInset = { bottom: "always" };

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

type RouteParams = {
  accountId: string,
  deviceId: string,
  transaction: any,
  error: Error,
};

export default function ValidationError({ navigation, route }: Props) {
  const onClose = useCallback(() => {
    navigation.dangerouslyGetParent().pop();
  }, [navigation]);

  const contactUs = useCallback(() => {
    Linking.openURL(urls.contact);
  }, []);

  const retry = useCallback(() => {
    navigation.navigate(ScreenName.ClaimRewardsConnectDevice, route.params);
  }, [navigation, route.params]);

  return (
    <SafeAreaView style={styles.root} forceInset={forceInset}>
      <TrackScreen category="ClaimRewards" name="ValidationError" />
      <ValidateError
        error={route.params.error}
        onRetry={retry}
        onClose={onClose}
        onContactUs={contactUs}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
});
