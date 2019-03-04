// @flow
import React, { Component } from "react";
import { StyleSheet, View } from "react-native";
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
import type { Step } from "../DeviceJob/types";
import { setReadOnlyMode } from "../../actions/settings";
import BottomModal from "../BottomModal";
import Button from "../Button";
import ModalBottomAction from "../ModalBottomAction";
import Trash from "../../icons/Trash";

type Props = {
  onForgetSelect?: (deviceId: string) => any,
  onSelect: (deviceId: string, meta: Object) => void,
  selectedIds?: string[],
  steps: Step[],
  editMode?: boolean,
  showDiscoveredDevices: boolean,
  showKnownDevices: boolean,
  ListEmptyComponent: *,
  // connect-ed
  knownDevices: Array<{
    id: string,
    name: string,
  }>,
  removeKnownDevice: string => *,
  onStepEntered?: (number, Object) => void,
  setReadOnlyMode: boolean => void,
  onboarding?: boolean,
  filter: TransportModule => boolean,
};

type State = {
  devices: Array<{
    id: string,
    name: string,
    family: string,
  }>,
  scanning: boolean,
  connecting: boolean,
  connectingId: ?string,
  showMenu: boolean,
};

class SelectDevice extends Component<Props, State> {
  static defaultProps = {
    steps: [],
    filter: () => true,
    showDiscoveredDevices: true,
    showKnownDevices: true,
  };

  state = {
    devices: [],
    scanning: true,
    connecting: false,
    connectingId: null,
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
                    family: e.family,
                  })
                : devices.filter(d => d.id !== e.id),
          })),
      });
  }

  onSelect = ({ id }) => {
    this.setState({ connecting: true, connectingId: id });
  };

  onDone = (id, meta) => {
    this.setState({ connecting: false }, () => {
      this.props.onSelect(id, meta);
    });

    // Always false until we pair a device?
    this.props.setReadOnlyMode(false);
  };

  onCancel = () => {
    this.setState({ connecting: false });
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

    const { devices, connecting, connectingId, showMenu } = this.state;
    const data = devices.concat(showKnownDevices ? knownDevices : []);
    const connectingDevice = data.find(d => d.id === connectingId);

    return (
      <View>
        <FlatList
          data={data}
          renderItem={this.renderItem}
          ListEmptyComponent={ListEmptyComponent || View}
          keyExtractor={this.keyExtractor}
        />
        <DeviceJob
          deviceName={connectingDevice ? connectingDevice.name : ""}
          deviceId={connecting && connectingId ? connectingId : null}
          steps={steps}
          onCancel={this.onCancel}
          onStepEntered={onStepEntered}
          onDone={this.onDone}
          editMode={editMode}
        />
        {showMenu && (
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
export default connect(
  createStructuredSelector({
    knownDevices: knownDevicesSelector,
  }),
  {
    removeKnownDevice,
    setReadOnlyMode,
  },
)(SelectDevice);
