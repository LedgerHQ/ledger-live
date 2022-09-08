import React, { Component, useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import {
  useIsFocused,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { Trans } from "react-i18next";
import manager from "@ledgerhq/live-common/manager/index";
import { Device } from "@ledgerhq/live-common/hw/actions/types";

import connectManager from "@ledgerhq/live-common/hw/connectManager";
import { createAction } from "@ledgerhq/live-common/hw/actions/manager";
import { Flex, Text } from "@ledgerhq/native-ui";
import { ScreenName } from "../../const";
import { ManagerTab } from "./Manager";
import SelectDevice from "../../components/SelectDevice2";
import TrackScreen from "../../analytics/TrackScreen";
import { track } from "../../analytics";
import type { DeviceLike } from "../../reducers/ble";
import NavigationScrollView from "../../components/NavigationScrollView";
import DeviceActionModal from "../../components/DeviceActionModal";
import { BaseNavigatorProps } from "../../components/RootNavigator/BaseNavigatorTypes";

const action = createAction(connectManager);

type RouteParams = {
  searchQuery?: string;
  tab?: ManagerTab;
  installApp?: string;
  firmwareUpdate?: boolean;
  device?: Device;
  appsToRestore?: string[];
};

type Props = {
  navigation: any;
  knownDevices: DeviceLike[];
  route: {
    params: RouteParams;
    name: string;
  };
};

type ChooseDeviceProps = Props & {
  isFocused: boolean;
};

const ChooseDevice: React.FC<ChooseDeviceProps> = ({ isFocused }) => {
  const [device, setDevice] = useState<Device | undefined>();

  const navigation = useNavigation<BaseNavigatorProps>();
  const { params } = useRoute<{
    params: RouteParams;
    name: string;
    key: string;
  }>();

  const onSelectDevice = (device?: Device) => {
    if (device)
      track("ManagerDeviceEntered", {
        modelId: device.modelId,
      });
    setDevice(device);
  };

  const onSelect = (result: any) => {
    setDevice(undefined);

    result?.result &&
      navigation.navigate(ScreenName.ManagerMain, {
        ...result,
        ...params,
        searchQuery: params?.searchQuery || params?.installApp,
      });
  };

  const onModalHide = () => {
    setDevice(undefined);
  };

  useEffect(() => {
    setDevice(params?.device);
  }, [params]);

  if (!isFocused) return null;

  return (
    <NavigationScrollView
      style={[styles.root]}
      contentContainerStyle={styles.scrollContainer}
    >
      <Flex mt={70}>
        <TrackScreen category="Manager" name="ChooseDevice" />
        <Text fontWeight="semiBold" variant="h4">
          <Trans i18nKey="manager.title" />
        </Text>
        <SelectDevice onSelect={onSelectDevice} />
        <DeviceActionModal
          onClose={() => onSelectDevice()}
          device={device}
          onResult={onSelect}
          onModalHide={onModalHide}
          action={action}
          request={null}
        />
      </Flex>
    </NavigationScrollView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 16,
  },
  title: {
    lineHeight: 27,
    fontSize: 18,
    marginVertical: 24,
  },
  footerContainer: {
    flexDirection: "row",
  },
  buttonContainer: {
    flex: 1,
  },
});

export default function Screen(props: Props) {
  const isFocused = useIsFocused();

  return <ChooseDevice {...props} isFocused={isFocused} />;
}
