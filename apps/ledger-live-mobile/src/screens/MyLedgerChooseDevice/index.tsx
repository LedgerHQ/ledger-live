import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useIsFocused, useNavigation, useRoute } from "@react-navigation/native";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { BluetoothRequired } from "@ledgerhq/errors";
import { Result } from "@ledgerhq/live-common/hw/actions/manager";
import { Flex } from "@ledgerhq/native-ui";
import { ScreenName } from "~/const";
import SelectDevice2, { SetHeaderOptionsRequest } from "~/components/SelectDevice2";
import TrackScreen from "~/analytics/TrackScreen";
import { track } from "~/analytics";
import DeviceActionModal from "~/components/DeviceActionModal";
import {
  BaseComposite,
  ReactNavigationHeaderOptions,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";

import { MyLedgerNavigatorStackParamList } from "~/components/RootNavigator/types/MyLedgerNavigator";

import { useManagerDeviceAction } from "~/hooks/deviceActions";
import ContentCardsLocation from "~/dynamicContent/ContentCardsLocation";
import { ContentCardLocation } from "~/dynamicContent/types";
import { useAutoRedirectToPostOnboarding } from "~/hooks/useAutoRedirectToPostOnboarding";
import { HOOKS_TRACKING_LOCATIONS } from "~/analytics/hooks/variables";
import SafeAreaView from "~/components/SafeAreaView";
import { wallet40HeaderOptions } from "~/screens/MyLedgerChooseDevice/wallet40HeaderOptions";

type NavigationProps = BaseComposite<
  StackNavigatorProps<MyLedgerNavigatorStackParamList, ScreenName.MyLedgerChooseDevice>
>;

type Props = NavigationProps;

// Defines here some of the header options for this screen to be able to reset back to them.
export const headerOptions: ReactNavigationHeaderOptions = {
  headerShown: false,
};

type ChooseDeviceProps = Props & {
  isFocused: boolean;
};

const ChooseDevice: React.FC<ChooseDeviceProps> = ({ isFocused }) => {
  const action = useManagerDeviceAction();
  const [device, setDevice] = useState<Device | null>();

  const navigation = useNavigation<NavigationProps["navigation"]>();
  const { params } = useRoute<NavigationProps["route"]>();

  /**
   * FIXME:
   * This is here because for now the Recover upsell redirect to this screen (My Ledger)
   * via a deeplink, and after the Recover upsell, we are supposed to automatically redirect
   * to the post-onboarding hub.
   * When the Recover webpage is fixed to only redirect to the Portfolio screen, this can be removed.
   */
  useAutoRedirectToPostOnboarding();

  const onSelectDevice = (device?: Device) => {
    if (device)
      track("ManagerDeviceEntered", {
        modelId: device.modelId,
      });
    setDevice(device);
  };

  const onSelect = (result: Result) => {
    setDevice(undefined);

    if (result && "result" in result) {
      // FIXME: nullable stuff not taken into account here?
      // `result` overrides values from `params` (prop `device` for ex)
      // @ts-expect-error Result has nullable fields
      navigation.navigate(ScreenName.MyLedgerDevice, {
        ...params,
        ...result,
        searchQuery: params?.searchQuery || params?.installApp,
      });
    }
  };

  const onModalHide = () => {
    setDevice(undefined);
  };

  const onError = (error: Error) => {
    // Both the old (SelectDevice) and new (SelectDevice2) device selection components handle the bluetooth requirements with a hook + bottom drawer.
    // By setting back the device to `undefined` it gives back the responsibilities to those select components to check for the bluetooth requirements
    // and avoids a duplicated error drawers/messages.
    // The only drawback: the user has to select again their device once the bluetooth requirements are respected.
    if (error instanceof BluetoothRequired) {
      setDevice(undefined);
    }
  };

  useEffect(() => {
    setDevice(params?.device);
  }, [params?.device]);

  const requestToSetHeaderOptions = useCallback(
    (request: SetHeaderOptionsRequest) => {
      if (request.type === "set") {
        navigation.setOptions({
          headerShown: true,
          headerTitle: "",
          headerLeft: request.options.headerLeft,
          headerRight: request.options.headerRight,
          title: "",
        });
      } else {
        navigation.setOptions({ ...wallet40HeaderOptions, headerRight: () => null });
      }
    },
    [navigation],
  );

  const Container = SafeAreaView;
  const containerProps = useMemo(() => ({ isFlex: true, edges: ["left", "right"] as const }), []);

  if (!isFocused) return null;

  return (
    <Container {...containerProps}>
      <TrackScreen category="Manager" name="ChooseDevice" />
      <Flex flex={1}>
        <SelectDevice2
          onSelect={onSelectDevice}
          stopBleScanning={!!device}
          requestToSetHeaderOptions={requestToSetHeaderOptions}
          withMyLedgerTracking
        >
          <ContentCardsLocation
            key="contentCardsLocationMyLedger"
            locationId={ContentCardLocation.MyLedger}
            mt={3}
          />
        </SelectDevice2>
      </Flex>
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
    </Container>
  );
};

export default function MyLedgerChooseDeviceScreen(props: Props) {
  const isFocused = useIsFocused();
  return <ChooseDevice {...props} isFocused={isFocused} />;
}
