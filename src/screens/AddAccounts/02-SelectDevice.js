// @flow

import React, { useCallback, useEffect } from "react";
import { StyleSheet } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import type { CryptoCurrency } from "@ledgerhq/live-common/lib/types";

import { prepareCurrency } from "../../bridge/cache";
import { ScreenName } from "../../const";
import colors from "../../colors";
import { TrackScreen } from "../../analytics";
import SelectDevice from "../../components/SelectDevice";
import { connectingStep, currencyApp } from "../../components/DeviceJob/steps";
import NavigationScrollView from "../../components/NavigationScrollView";

const forceInset = { bottom: "always" };

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

type RouteParams = {
  currency: CryptoCurrency,
};

export default function AddAccountsSelectDevice({ navigation, route }: Props) {
  const onSelectDevice = useCallback(
    (meta: *) => {
      const currency = route.params.currency;
      navigation.navigate(ScreenName.AddAccountsAccounts, {
        currency,
        ...meta,
      });
    },
    [navigation, route],
  );

  useEffect(() => {
    // load ahead of time
    prepareCurrency(route.params.currency);
  }, [route.params.currency]);

  const currency = route.params.currency;
  return (
    <SafeAreaView style={styles.root} forceInset={forceInset}>
      <NavigationScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContainer}
      >
        <TrackScreen category="AddAccounts" name="SelectDevice" />
        <SelectDevice
          onSelect={onSelectDevice}
          steps={[connectingStep, currencyApp(currency)]}
        />
      </NavigationScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scroll: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
  },
});
