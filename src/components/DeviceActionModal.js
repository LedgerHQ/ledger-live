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
  onResult: $PropertyType<React$ElementProps<typeof DeviceAction>, "onResult">,
};

export default function DeviceActionModal({
  action,
  device,
  request,
  onClose,
  onResult,
  onModalHide,
}: Props) {
  const { colors } = useTheme();
  return (
    <BottomModal
      id="DeviceActionModal"
      isOpened={!!device}
      onClose={onClose}
      onResult={onResult}
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
