// @flow
import React, { Component } from "react";
import { StyleSheet, View } from "react-native";
import Config from "react-native-config";
// $FlowFixMe
import { FlatList } from "react-navigation";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import { discoverDevices } from "@ledgerhq/live-common/lib/hw";
import { Trans } from "react-i18next";
import type { TransportModule } from "@ledgerhq/live-common/lib/hw";
import { knownDevicesSelector } from "../../reducers/ble";
import { removeKnownDevice } from "../../actions/ble";
import DeviceItem from "../DeviceItem";
import DeviceJob from "../DeviceJob";
import type { Step, DeviceMeta } from "../DeviceJob/types";
import { setReadOnlyMode } from "../../actions/settings";
import BottomModal from "../BottomModal";
import Button from "../Button";
import ModalBottomAction from "../ModalBottomAction";
import Trash from "../../icons/Trash";

type Props = {
  onForgetSelect?: (deviceId: string) => any,
  // info is an object with { deviceId, modelId } and potentially other stuff
  onSelect: (meta: DeviceMeta) => void,
  steps?: Step[],
  // TODO suggest to rename it to `Placeholder`
  ListEmptyComponent: *,
  // TODO we need to remove the concept of editMode and selectedIds
  selectedIds?: string[],
  editMode?: boolean,
  onStepEntered?: (number, Object) => void,
  onboarding?: boolean,
  filter?: TransportModule => boolean,
  showDiscoveredDevices?: boolean,
  showKnownDevices?: boolean,
};

type OwnProps = Props & {
  knownDevices: Array<{
    id: string,
    name: string,
  }>,
  removeKnownDevice: string => *,
  setReadOnlyMode: boolean => void,
};

type State = {
  devices: Array<{
    id: string,
    name: string,
    modelId: ?string,
  }>,
  scanning: boolean,
  connecting: ?DeviceMeta,
  showMenu: boolean,
};

class SelectDevice extends Component<OwnProps, State> {
  static defaultProps = {
    steps: [],
    filter: () => true,
    showDiscoveredDevices: true,
    showKnownDevices: true,
  };

  state = {
    devices: [],
    scanning: true,
    connecting: null,
    showMenu: false,
  };

  listingSubscription: *;

  componentDidMount() {
    this.observe();
  }

  componentDidUpdate({ knownDevices }) {
    if (this.props.knownDevices !== knownDevices) {
      this.observe();
    }
  }

  componentWillUnmount() {
    if (this.listingSubscription) {
      this.listingSubscription.unsubscribe();
    }
  }

  observe() {
    const { showDiscoveredDevices } = this.props;
    if (this.listingSubscription) {
      this.listingSubscription.unsubscribe();
      this.setState({ devices: [] });
    }
    this.listingSubscription =
      showDiscoveredDevices &&
      discoverDevices(this.props.filter).subscribe({
        complete: () => {
          this.setState({ scanning: false });
        },
        next: e =>
          this.setState(({ devices }) => ({
            devices:
              e.type === "add"
                ? devices.concat({
                    id: e.id,
                    name: e.name,
                    modelId: e.deviceModel && e.deviceModel.id,
                  })
                : devices.filter(d => d.id !== e.id),
          })),
      });
  }

  onSelect = ({ id, modelId, name }) => {
    let connecting = null;
    if (id.startsWith("httpdebug|")) {
      /*
     * This allow to define these env to override the behavior
     * FALLBACK_DEVICE_MODEL_ID=nanoS
     * FALLBACK_DEVICE_WIRED=YES
     */
      connecting = {
        deviceId: id,
        modelId: modelId || (Config.FALLBACK_DEVICE_MODEL_ID || "nanoX"),
        deviceName: name || "",
        wired: Config.FALLBACK_DEVICE_WIRED === "YES",
      };
    } else {
      connecting = {
        deviceId: id,
        modelId: modelId || "nanoX",
        deviceName: name || "",
        wired: id.startsWith("usb|"),
      };
    }
    this.setState({ connecting });
  };

  onDone = info => {
    this.setState({ connecting: null }, () => {
      this.props.onSelect(info);
    });

    // Always false until we pair a device?
    this.props.setReadOnlyMode(false);
  };

  onCancel = () => {
    this.setState({ connecting: null });
  };

  onShowMenu = () => {
    this.setState({ showMenu: true });
  };

  onHideMenu = () => {
    this.setState({ showMenu: false });
  };

  renderItem = ({ item }: *) => (
    <DeviceItem
      key={item.id}
      device={item}
      onSelect={this.onSelect}
      withArrow={!!this.props.onboarding}
      onShowMenuSelect={this.onShowMenu}
      {...item}
    />
  );

  keyExtractor = (item: *) => item.id;

  render() {
    const {
      showKnownDevices,
      ListEmptyComponent,
      knownDevices,
      steps,
      editMode,
      onStepEntered,
    } = this.props;
    const { devices, connecting, showMenu } = this.state;
    const data = devices.concat(showKnownDevices ? knownDevices : []);

    return (
      <View>
        <FlatList
          data={data}
          renderItem={this.renderItem}
          ListEmptyComponent={ListEmptyComponent}
          keyExtractor={this.keyExtractor}
        />
        <DeviceJob
          meta={connecting}
          steps={steps}
          onCancel={this.onCancel}
          onStepEntered={onStepEntered}
          onDone={this.onDone}
          editMode={editMode}
        />
        {showMenu && (
          // TODO: Juan: menu should be externalized. it's not concerns of DeviceSelect component but should be
          // moved into the Manager screen itself, as well as the related showMenu (tip: introduce a onShowMenu)
          <BottomModal
            id="DeviceItemModal"
            isOpened={showMenu}
            onClose={this.onHideMenu}
          >
            <ModalBottomAction
              title="NO NAME YET" // FIXME get the name from @gre refactor
              footer={
                <View style={styles.footerContainer}>
                  <Button
                    event="HardResetModalAction"
                    type="alert"
                    IconLeft={Trash}
                    title={<Trans i18nKey="common.forgetDevice" />}
                    onPress={() => null}
                    containerStyle={styles.buttonContainer}
                  />
                </View>
              }
            />
          </BottomModal>
        )}
      </View>
    );
  }
}
const styles = StyleSheet.create({
  footerContainer: {
    flexDirection: "row",
  },
  buttonContainer: {
    flex: 1,
  },
  buttonMarginLeft: {
    marginLeft: 16,
  },
});

const Result: React$ComponentType<Props> = connect(
  createStructuredSelector({
    knownDevices: knownDevicesSelector,
  }),
  {
    removeKnownDevice,
    setReadOnlyMode,
  },
)(SelectDevice);

export default Result;
