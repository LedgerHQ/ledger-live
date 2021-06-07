// @flow

import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, SafeAreaView } from "react-native";
import type { CryptoCurrency } from "@ledgerhq/live-common/lib/types";
import type { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import { createAction } from "@ledgerhq/live-common/lib/hw/actions/app";
import connectApp from "@ledgerhq/live-common/lib/hw/connectApp";
import { useTheme } from "@react-navigation/native";
import { prepareCurrency } from "../../bridge/cache";
import { ScreenName } from "../../const";
import { TrackScreen } from "../../analytics";
import SelectDevice from "../../components/SelectDevice";
import NavigationScrollView from "../../components/NavigationScrollView";
import DeviceActionModal from "../../components/DeviceActionModal";

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

type RouteParams = {
  currency: CryptoCurrency,
  inline?: boolean,
  returnToSwap?: boolean,
};

const action = createAction(connectApp);

export default function AddAccountsSelectDevice({ navigation, route }: Props) {
  const { colors } = useTheme();
  const [device, setDevice] = useState<?Device>();

  const onClose = useCallback(() => {
    setDevice();
  }, []);

  const onResult = useCallback(
    meta => {
      setDevice();
      const { inline } = route.params;
      const arg = { ...route.params, ...meta };
      if (inline) {
        navigation.replace(ScreenName.AddAccountsAccounts, arg);
      } else {
        navigation.navigate(ScreenName.AddAccountsAccounts, arg);
      }
    },
    [navigation, route],
  );

  useEffect(() => {
    // load ahead of time
    prepareCurrency(route.params.currency);
  }, [route.params.currency]);

  const currency = route.params.currency;
  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <NavigationScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContainer}
      >
        <TrackScreen
          category="AddAccounts"
          name="SelectDevice"
          currencyName={currency.name}
        />
        <SelectDevice onSelect={setDevice} />
      </NavigationScrollView>
      <DeviceActionModal
        action={action}
        device={device}
        onResult={onResult}
        onClose={onClose}
        request={{
          currency:
            currency.type === "TokenCurrency"
              ? currency.parentCurrency
              : currency,
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollContainer: {
    padding: 16,
  },
});
