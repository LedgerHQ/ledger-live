import React, { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import {
  useIsFocused,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { Trans } from "react-i18next";
import { Device } from "@ledgerhq/live-common/hw/actions/types";

import connectManager from "@ledgerhq/live-common/hw/connectManager";
import { createAction, Result } from "@ledgerhq/live-common/hw/actions/manager";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { Flex, Text } from "@ledgerhq/native-ui";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenName } from "../../const";
import SelectDevice2 from "../../components/SelectDevice2";
import SelectDevice from "../../components/SelectDevice";
import RemoveDeviceMenu from "../../components/SelectDevice2/RemoveDeviceMenu";
import TrackScreen from "../../analytics/TrackScreen";
import { track } from "../../analytics";
import NavigationScrollView from "../../components/NavigationScrollView";
import DeviceActionModal from "../../components/DeviceActionModal";
import {
  BaseComposite,
  StackNavigatorProps,
} from "../../components/RootNavigator/types/helpers";
import { ManagerNavigatorStackParamList } from "../../components/RootNavigator/types/ManagerNavigator";
import ServicesWidget from "../../components/ServicesWidget";

import { TAB_BAR_SAFE_HEIGHT } from "../../components/TabBar/shared";

import { useExperimental } from "../../experimental";
import { HEIGHT as ExperimentalHeaderHeight } from "../Settings/Experimental/ExperimentalHeader";

const action = createAction(connectManager);

type NavigationProps = BaseComposite<
  StackNavigatorProps<ManagerNavigatorStackParamList, ScreenName.Manager>
>;

type Props = NavigationProps;

type ChooseDeviceProps = Props & {
  isFocused: boolean;
};

const ChooseDevice: React.FC<ChooseDeviceProps> = ({ isFocused }) => {
  const [device, setDevice] = useState<Device | null>();

  const [chosenDevice, setChosenDevice] = useState<Device | null>();
  const [showMenu, setShowMenu] = useState<boolean>(false);

  const navigation = useNavigation<NavigationProps["navigation"]>();
  const { params } = useRoute<NavigationProps["route"]>();

  const isExperimental = useExperimental();
  const newDeviceSelectionFeatureFlag = useFeature("llmNewDeviceSelection");

  const onSelectDevice = (device?: Device) => {
    if (device)
      track("ManagerDeviceEntered", {
        modelId: device.modelId,
      });
    setDevice(device);
  };

  const onShowMenu = (device: Device) => {
    setChosenDevice(device);
    setShowMenu(true);
  };

  const onHideMenu = () => setShowMenu(false);

  const onSelect = (result: Result) => {
    setDevice(undefined);

    if (result && "result" in result) {
      // FIXME: nullable stuff not taken into account here?
      // @ts-expect-error Result has nullable fields
      navigation.navigate(ScreenName.ManagerMain, {
        ...result,
        ...params,
        searchQuery: params?.searchQuery || params?.installApp,
      });
    }
  };

  const onModalHide = () => {
    setDevice(undefined);
  };

  useEffect(() => {
    setDevice(params?.device);
  }, [params]);

  const insets = useSafeAreaInsets();

  if (!isFocused) return null;

  return (
    <Flex flex={1} pt={(isExperimental ? ExperimentalHeaderHeight : 0) + 70}>
      <TrackScreen category="Manager" name="ChooseDevice" />
      <Flex px={16} mb={8}>
        <Text fontWeight="semiBold" variant="h4" testID="manager-title">
          <Trans i18nKey="manager.title" />
        </Text>
      </Flex>

      {newDeviceSelectionFeatureFlag?.enabled ? (
        <Flex flex={1} px={16} pb={insets.bottom + TAB_BAR_SAFE_HEIGHT}>
          <SelectDevice2
            onSelect={onSelectDevice}
            stopBleScanning={!!device}
            displayServicesWidget
          />
        </Flex>
      ) : (
        <NavigationScrollView
          style={{ paddingBottom: insets.bottom + TAB_BAR_SAFE_HEIGHT }}
          contentContainerStyle={styles.scrollContainer}
        >
          <SelectDevice
            usbOnly={params?.firmwareUpdate}
            autoSelectOnAdd
            onSelect={onSelectDevice}
            onBluetoothDeviceAction={onShowMenu}
          />
          {chosenDevice ? (
            <RemoveDeviceMenu
              open={showMenu}
              device={chosenDevice as Device}
              onHideMenu={onHideMenu}
            />
          ) : null}
          <ServicesWidget />
        </NavigationScrollView>
      )}
      <DeviceActionModal
        onClose={() => onSelectDevice()}
        device={device}
        onResult={onSelect}
        onModalHide={onModalHide}
        action={action}
        request={null}
      />
    </Flex>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: 16,
    flexGrow: 1,
    justifyContent: "space-between",
  },
});

export default function Screen(props: Props) {
  const isFocused = useIsFocused();

  return <ChooseDevice {...props} isFocused={isFocused} />;
}
