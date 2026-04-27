import React, { useCallback, useState } from "react";
import { Linking } from "react-native";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { BluetoothRequired } from "@ledgerhq/errors";
import { Result } from "@ledgerhq/live-common/hw/actions/manager";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { NavigatorName, ScreenName } from "~/const";
import SelectDevice2, { SetHeaderOptionsRequest } from "~/components/SelectDevice2";
import { track } from "~/analytics";
import DeviceActionModal from "~/components/DeviceActionModal";
import { useManagerDeviceAction } from "~/hooks/deviceActions";
import { HOOKS_TRACKING_LOCATIONS } from "~/analytics/hooks/variables";
import { urls } from "~/utils/urls";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import type { LumenNativeStackNavigationOptions } from "LLM/components/Navigation";
import { ExploreDevicesItem } from "./DeviceSection/components/ExploreDevicesItem";
import { MyWalletHeaderTrailing } from "./Header";

function MyLedgerSectionContent() {
  const action = useManagerDeviceAction();
  const [device, setDevice] = useState<Device>();
  // TODO(wallet40-myWallet): enable ExploreDevicesItem when ready
  const { shouldDisplayMyWallet } = useWalletFeaturesConfig("mobile");

  const navigation =
    useNavigation<NativeStackNavigationProp<{ [key: string]: object | undefined }>>();

  const exploreDevicesUrl = useLocalizedUrl(urls.exploreLedgerDevices);

  const onExploreDevices = useCallback(() => {
    track("button_clicked", { button: "ExploreDevices", page: ScreenName.MyWallet });
    Linking.openURL(exploreDevicesUrl);
  }, [exploreDevicesUrl]);

  const onSelectDevice = (selected?: Device) => {
    if (selected)
      track("ManagerDeviceEntered", {
        modelId: selected.modelId,
      });
    setDevice(selected);
  };

  const onSelect = (result: Result) => {
    setDevice(undefined);

    if (result && "result" in result) {
      navigation.navigate(NavigatorName.MyLedger, {
        screen: ScreenName.MyLedgerDevice,
        params: { ...result },
      });
    }
  };

  const onModalHide = () => {
    setDevice(undefined);
  };

  const onError = (error: Error) => {
    if (error instanceof BluetoothRequired) {
      setDevice(undefined);
    }
  };

  const requestToSetHeaderOptions = useCallback(
    (request: SetHeaderOptionsRequest) => {
      const opts: Partial<LumenNativeStackNavigationOptions> =
        request.type === "set"
          ? {
              lumenNavBar: {
                renderLeading: request.options.headerLeft,
                renderTrailing: request.options.headerRight,
                renderCenter: () => null,
              },
            }
          : {
              lumenNavBar: {
                renderLeading: undefined,
                renderCenter: () => null,
                renderTrailing: () => <MyWalletHeaderTrailing />,
              },
            };
      navigation.setOptions(opts);
    },
    [navigation],
  );

  return (
    <>
      <Box style={{ flex: 1 }}>
        <SelectDevice2
          onSelect={onSelectDevice}
          stopBleScanning={!!device}
          requestToSetHeaderOptions={requestToSetHeaderOptions}
          withMyLedgerTracking
          hasPostOnboardingEntryPointCard
        >
          {/* TODO(wallet40-myWallet): enable ExploreDevicesItem when ready */}
          {!shouldDisplayMyWallet && <ExploreDevicesItem onPress={onExploreDevices} />}
        </SelectDevice2>
      </Box>
      <DeviceActionModal
        onClose={() => onSelectDevice()}
        device={device}
        onResult={onSelect}
        onModalHide={onModalHide}
        action={action}
        request={null}
        onError={onError}
        location={HOOKS_TRACKING_LOCATIONS.myLedgerDashboard}
      />
    </>
  );
}

export function MyLedgerSection() {
  const isFocused = useIsFocused();
  if (!isFocused) return null;
  return <MyLedgerSectionContent />;
}
