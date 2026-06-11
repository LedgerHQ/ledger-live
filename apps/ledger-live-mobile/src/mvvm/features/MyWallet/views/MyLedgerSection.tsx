import React, { useCallback, useEffect, useState } from "react";
import { Linking } from "react-native";
import { useIsFocused, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { BluetoothRequired } from "@ledgerhq/errors";
import { Result } from "@ledgerhq/live-common/hw/actions/manager";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { NavigatorName, ScreenName } from "~/const";
import SelectDevice2, { SetHeaderOptionsRequest } from "~/components/SelectDevice2";
import { track } from "~/analytics";
import { MY_WALLET_TRACKING_PAGE_NAME } from "../constants";
import DeviceActionModal from "~/components/DeviceActionModal";
import { useManagerDeviceAction } from "~/hooks/deviceActions";
import { useAutoRedirectToPostOnboarding } from "~/hooks/useAutoRedirectToPostOnboarding";
import { HOOKS_TRACKING_LOCATIONS } from "~/analytics/hooks/variables";
import { urls } from "~/utils/urls";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import type { LumenNativeStackNavigationOptions } from "LLM/components/Navigation";
import type { MyWalletNavigatorStackParamList } from "../types";
import { ExploreDevicesItem } from "./DeviceSection/components/ExploreDevicesItem";
import { MyWalletHeaderTrailing } from "./Header";

type MyLedgerSectionProps = {
  onPairingStateChanged?: (isPairing: boolean) => void;
};

function MyLedgerSectionContent({ onPairingStateChanged }: MyLedgerSectionProps) {
  const action = useManagerDeviceAction();
  const [device, setDevice] = useState<Device>();
  const [isHeaderOverridden, setIsHeaderOverridden] = useState<boolean>(false);

  useEffect(() => {
    onPairingStateChanged?.(isHeaderOverridden);
  }, [isHeaderOverridden, onPairingStateChanged]);

  const { params } =
    useRoute<RouteProp<MyWalletNavigatorStackParamList, typeof ScreenName.MyWallet>>();

  useAutoRedirectToPostOnboarding();

  // Auto-select a device passed via navigation params (e.g. redirect from "not enough space" error during a transactional flow).
  useEffect(() => {
    setDevice(params?.device);
  }, [params?.device]);
  // TODO(wallet40-myWallet): enable ExploreDevicesItem when ready
  const { shouldDisplayMyWallet } = useWalletFeaturesConfig("mobile");

  const navigation =
    useNavigation<NativeStackNavigationProp<{ [key: string]: object | undefined }>>();

  const exploreDevicesUrl = useLocalizedUrl(urls.exploreLedgerDevices);

  const onExploreDevices = useCallback(() => {
    track("button_clicked", { button: "ExploreDevices", page: MY_WALLET_TRACKING_PAGE_NAME });
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
        params: {
          ...result,
          firmwareUpdate: params?.firmwareUpdate,
          searchQuery: params?.searchQuery || params?.installApp,
        },
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
      if (request.type === "set") {
        const HeaderLeft = request.options.headerLeft;
        const opts: Partial<LumenNativeStackNavigationOptions> = {
          lumenNavBar: {
            renderLeading: HeaderLeft
              ? () => (
                  <Box style={{ paddingLeft: 12 }}>
                    <HeaderLeft />
                  </Box>
                )
              : undefined,
            renderTrailing: request.options.headerRight,
            renderCenter: () => null,
          },
        };
        navigation.setOptions(opts);
        setIsHeaderOverridden(true);
      } else {
        const opts: Partial<LumenNativeStackNavigationOptions> = {
          lumenNavBar: {
            renderLeading: undefined,
            renderCenter: () => null,
            renderTrailing: () => <MyWalletHeaderTrailing />,
          },
        };
        navigation.setOptions(opts);
        setIsHeaderOverridden(false);
      }
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

export function MyLedgerSection({ onPairingStateChanged }: MyLedgerSectionProps) {
  const isFocused = useIsFocused();
  if (!isFocused) return null;
  return <MyLedgerSectionContent onPairingStateChanged={onPairingStateChanged} />;
}
