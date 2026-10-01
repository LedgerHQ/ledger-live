import React, { useCallback, useEffect, useRef } from "react";
import { View } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { Button } from "@ledgerhq/native-ui";
import SafeAreaView from "~/components/SafeAreaView";
import Alert from "~/components/Alert";
import TranslatedError from "~/components/TranslatedError";
import SelectDeviceScreen from "~/screens/SelectDevice";
import { useTranslation } from "~/context/Locale";
import { ScreenName } from "~/const";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { stacksFlowStyles as styles } from "../shared/styles";
import type { StacksStakingFlowParamList } from "./types";
import { useStartBurnHtRefresh } from "./useStartBurnHtRefresh";

type Props = BaseComposite<
  StackNavigatorProps<StacksStakingFlowParamList, ScreenName.StacksStakingSelectDevice>
>;

/**
 * The shared SelectDevice screen forwards its own route params to ConnectDevice, so refreshing
 * `startBurnHt` in those params keeps the height fresh until a device is picked. ConnectDevice
 * then signs that snapshot, the same point at which LLD's StakeFlowModal stops refreshing.
 */
export default function StakingSelectDevice(props: Props) {
  const { navigation, route } = props;
  const { t } = useTranslation();
  const isFocused = useIsFocused();

  const transactionRef = useRef(route.params.transaction);
  useEffect(() => {
    transactionRef.current = route.params.transaction;
  }, [route.params.transaction]);

  const onStartBurnHtResolved = useCallback(
    (startBurnHt: number) => {
      const transaction = transactionRef.current;
      if (!transaction) return;
      navigation.setParams({
        transaction: {
          ...transaction,
          familySpecificData: { ...transaction.familySpecificData, startBurnHt },
        },
      });
    },
    [navigation],
  );

  const { poxError, retry } = useStartBurnHtRefresh(isFocused, onStartBurnHtResolved);

  // Unlike Amount, there's no Continue to disable here: device auto-selection would carry on with a
  // height that can no longer be refreshed, so the device list is replaced until the retry succeeds.
  if (poxError) {
    return (
      <SafeAreaView style={styles.root} edges={["bottom"]}>
        <View style={styles.content} testID="stacks-stake-select-device-pox-error">
          <Alert type="error">
            <TranslatedError error={poxError} />
          </Alert>
          <Button
            mt={4}
            outline
            type="main"
            size="large"
            onPress={retry}
            testID="stacks-stake-select-device-pox-retry"
          >
            {t("common.retry")}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SelectDeviceScreen
      {...(props as unknown as React.ComponentProps<typeof SelectDeviceScreen>)}
    />
  );
}
