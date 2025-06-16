import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useIsFocused } from "@react-navigation/native";
import { Flex } from "@ledgerhq/native-ui";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DeviceActionModal from "~/components/DeviceActionModal";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import {
  PlatformExchangeNavigatorParamList,
  ResultStart,
} from "~/components/RootNavigator/types/PlatformExchangeNavigator";
import SelectDevice2 from "~/components/SelectDevice2";
import { ScreenName } from "~/const";
import { useStartExchangeDeviceAction } from "~/hooks/deviceActions";
import { HOOKS_TRACKING_LOCATIONS } from "~/analytics/hooks/variables";

type Props = StackNavigatorProps<
  PlatformExchangeNavigatorParamList,
  ScreenName.PlatformStartExchange
>;

export default function PlatformStartExchange({ navigation, route }: Props) {
  const action = useStartExchangeDeviceAction();
  const [device, setDevice] = useState<Device>();
  const isFocused = useIsFocused();
  const hasPopped = useRef(false);

  const onClose = useCallback(() => {
    // Prevent onClose being called twice
    if (!hasPopped.current) {
      navigation.pop();
    }
    hasPopped.current = true;
  }, [navigation]);

  const onResult = useCallback(
    (result: ResultStart) => {
      route.params.onResult({ ...result, device });
    },
    [device, route.params],
  );

  // Does not react to an header update request, the header stays the same.
  const requestToSetHeaderOptions = useCallback(() => undefined, []);
  const request = useMemo(() => route.params.request, [route.params.request]);
  return (
    <SafeAreaView style={styles.root} edges={["bottom"]}>
      <Flex px={16} flex={1} mt={8}>
        <SelectDevice2
          onSelect={setDevice}
          stopBleScanning={!!device || !isFocused}
          requestToSetHeaderOptions={requestToSetHeaderOptions}
        />
      </Flex>
      <DeviceActionModal
        device={device}
        action={action}
        onClose={onClose}
        onResult={onResult}
        request={request}
        location={HOOKS_TRACKING_LOCATIONS.swapFlow}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
