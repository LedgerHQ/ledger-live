// @flow
import React from "react";
import { View, StyleSheet } from "react-native";
import type { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import { useTheme } from "@react-navigation/native";
import DeviceAction from "./DeviceAction";
import BottomModal from "./BottomModal";
import ModalBottomAction from "./ModalBottomAction";
import Close from "../icons/Close";
import Touchable from "./Touchable";

type Props = {
  // TODO: fix action type
  action: any,
  device: ?Device,
  // TODO: fix request type
  request?: any,
  onClose?: () => void,
  onModalHide?: () => void,
  onResult?: $PropertyType<React$ElementProps<typeof DeviceAction>, "onResult">,
  renderOnResult?: (p: any) => React$Node,
};

export default function DeviceActionModal({
  action,
  device,
  request,
  onClose,
  onResult,
  renderOnResult,
  onModalHide,
}: Props) {
  const { colors } = useTheme();
  return (
    <BottomModal
      id="DeviceActionModal"
      isOpened={!!device}
      onClose={onClose}
      onModalHide={onModalHide}
    >
      {device && (
        <ModalBottomAction
          footer={
            <View style={styles.footerContainer}>
              <DeviceAction
                action={action}
                device={device}
                request={request}
                onClose={onClose}
                onResult={onResult}
                renderOnResult={renderOnResult}
              />
            </View>
          }
        />
      )}
      <Touchable
        event="DeviceActionModalClose"
        style={styles.close}
        onPress={onClose}
      >
        <Close color={colors.fog} size={20} />
      </Touchable>
    </BottomModal>
  );
}

const styles = StyleSheet.create({
  footerContainer: {
    flexDirection: "row",
  },
  close: {
    position: "absolute",
    right: 16,
    top: 16,
  },
});
