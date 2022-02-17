// @flow
import React from "react";
import { View, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import type { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/lib/bridge/react";
import { useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { isModalLockedSelector } from "../reducers/appstate";
import DeviceAction from "./DeviceAction";
import BottomModal from "./BottomModal";
import ModalBottomAction from "./ModalBottomAction";
import Close from "../icons/Close";
import Touchable from "./Touchable";
import InfoBox from "./InfoBox";

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
  onSelectDeviceLink?: () => void,
  analyticsPropertyFlow?: string,
};

export default function DeviceActionModal({
  action,
  device,
  request,
  onClose,
  onResult,
  renderOnResult,
  onModalHide,
  onSelectDeviceLink,
  analyticsPropertyFlow,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
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
            <View>
              <View style={styles.footerContainer}>
                <DeviceAction
                  action={action}
                  device={device}
                  request={request}
                  onClose={onClose}
                  onResult={onResult}
                  renderOnResult={renderOnResult}
                  onSelectDeviceLink={onSelectDeviceLink}
                  analyticsPropertyFlow={analyticsPropertyFlow}
                />
              </View>
              {!device.wired ? (
                <InfoBox forceColor={{ text: colors.live }}>
                  {t("DeviceAction.stayInTheAppPlz")}
                </InfoBox>
              ) : null}
            </View>
          }
        />
      )}
      {device && <SyncSkipUnderPriority priority={100} />}
      <ModalLockAwareClose>
        <Touchable
          event="DeviceActionModalClose"
          style={styles.close}
          onPress={onClose}
        >
          <Close color={colors.fog} size={20} />
        </Touchable>
      </ModalLockAwareClose>
    </BottomModal>
  );
}

const ModalLockAwareClose = ({ children }) => {
  const modalLock = useSelector(isModalLockedSelector);
  if (modalLock) return null;
  return children;
};

const styles = StyleSheet.create({
  footerContainer: {
    flexDirection: "row",
    marginBottom: 10,
  },
  close: {
    position: "absolute",
    right: 16,
    top: 16,
  },
});
