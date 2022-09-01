import React, { Component } from "react";
import { StyleSheet } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { useDispatch } from "react-redux";
import { Trans } from "react-i18next";
import { disconnect } from "@ledgerhq/live-common/hw/index";
import { Device } from "@ledgerhq/live-common/hw/actions/types";

import connectManager from "@ledgerhq/live-common/hw/connectManager";
import { createAction } from "@ledgerhq/live-common/hw/actions/manager";
import { Text } from "@ledgerhq/native-ui";
import { removeKnownDevice } from "../../actions/ble";
import { ScreenName } from "../../const";
import SelectDevice from "../../components/SelectDevice";
import TrackScreen from "../../analytics/TrackScreen";
import { track } from "../../analytics";
import Button from "../../components/Button";
import Trash from "../../icons/Trash";
import BottomModal from "../../components/BottomModal";
import ModalBottomAction from "../../components/ModalBottomAction";
import NavigationScrollView from "../../components/NavigationScrollView";
import DeviceActionModal from "../../components/DeviceActionModal";
import Illustration from "../../images/illustration/Illustration";
import {
  BaseComposite,
  StackNavigatorProps,
} from "../../components/RootNavigator/types/helpers";
import { ManagerNavigatorStackParamList } from "../../components/RootNavigator/types/ManagerNavigator";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const darkImg = require("../../images/illustration/Dark/_079.png");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const lightImg = require("../../images/illustration/Light/_079.png");

const action = createAction(connectManager);

const RemoveDeviceModal = ({
  onHideMenu,
  remove,
  open,
  deviceName,
}: {
  onHideMenu: () => void;
  remove: () => Promise<void>;
  open: boolean;
  deviceName: string;
}) => (
  <BottomModal isOpened={open} onClose={onHideMenu}>
    <ModalBottomAction
      icon={
        <Illustration size={100} darkSource={darkImg} lightSource={lightImg} />
      }
      title={deviceName}
      uppercase={false}
      footer={
        <Button
          event="HardResetModalAction"
          type="alert"
          IconLeft={Trash}
          title={<Trans i18nKey="common.forgetDevice" />}
          onPress={remove}
        />
      }
    />
  </BottomModal>
);

type NavigationProps = BaseComposite<
  StackNavigatorProps<ManagerNavigatorStackParamList, ScreenName.Manager>
>;

type Props = NavigationProps;

type ChooseDeviceProps = Props & {
  isFocused: boolean;
  removeKnownDevice: (_: string) => void;
};

class ChooseDevice extends Component<
  ChooseDeviceProps,
  {
    showMenu: boolean;
    device?: Device;
    result?: any;
  }
> {
  state = {
    showMenu: false,
    device: undefined,
    result: undefined,
  };

  chosenDevice: Device | undefined;

  onShowMenu = (device: Device) => {
    this.chosenDevice = device;
    this.setState({ showMenu: true });
  };

  onHideMenu = () => {
    this.setState({ showMenu: false });
  };

  onSelectDevice = (device?: Device) => {
    if (device)
      track("ManagerDeviceEntered", {
        modelId: device.modelId,
      });
    this.setState({ device });
  };

  onSelect = (result: any) => {
    this.setState({ device: undefined, result });
    const {
      route: { params = {} },
    } = this.props;
    result?.result &&
      this.props.navigation.navigate(ScreenName.ManagerMain, {
        ...result,
        ...params,
        searchQuery: params.searchQuery || params.installApp,
      });
  };

  onModalHide = () => {
    this.setState({ device: undefined });
  };

  remove = async () => {
    const { removeKnownDevice } = this.props;
    if (!this.chosenDevice) return;
    removeKnownDevice(this.chosenDevice.deviceId);
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    await disconnect(this.chosenDevice.deviceId).catch(() => {});
    this.onHideMenu();
  };

  componentDidMount() {
    this.setState(state => ({
      ...state,
      device: this.props.route.params?.device,
    }));
  }

  render() {
    const {
      isFocused,
      route: { params = {} },
    } = this.props;
    const { showMenu, device } = this.state;

    if (!isFocused) return null;

    return (
      <NavigationScrollView
        style={[styles.root]}
        contentContainerStyle={styles.scrollContainer}
      >
        <TrackScreen category="Manager" name="ChooseDevice" />
        <Text fontWeight="semiBold" variant="h3">
          <Trans i18nKey="manager.connect" />
        </Text>
        <SelectDevice
          usbOnly={params?.firmwareUpdate}
          autoSelectOnAdd
          onSelect={this.onSelectDevice}
          onBluetoothDeviceAction={this.onShowMenu}
        />
        <DeviceActionModal
          onClose={() => this.onSelectDevice()}
          device={device}
          onResult={this.onSelect}
          onModalHide={this.onModalHide}
          action={action}
          request={null}
        />

        {this.chosenDevice && (
          <RemoveDeviceModal
            onHideMenu={this.onHideMenu}
            open={showMenu}
            remove={this.remove}
            deviceName={this.chosenDevice.deviceName || ""}
          />
        )}
      </NavigationScrollView>
    );
  }
}

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
  const dispatch = useDispatch();

  return (
    <ChooseDevice
      {...props}
      isFocused={isFocused}
      removeKnownDevice={(...args) => dispatch(removeKnownDevice(...args))}
    />
  );
}
