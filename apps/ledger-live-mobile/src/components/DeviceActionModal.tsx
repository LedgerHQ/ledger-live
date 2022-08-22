import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Alert, Flex } from "@ledgerhq/native-ui";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components/native";
import BottomModal from "./BottomModal";
import DeviceAction from "./DeviceAction";

const DeviceActionContainer = styled(Flex).attrs({
  flexDirection: "row",
})``;

type Props = {
  // TODO: fix action type
  action: any;
  device: Device | null | undefined;
  // TODO: fix request type
  request?: any;
  onClose?: () => void;
  onModalHide?: () => void;
  onResult?: (payload: any) => Promise<void> | void;
  renderOnResult?: (_: any) => React.ReactNode;
  onSelectDeviceLink?: () => void;
  analyticsPropertyFlow?: string;
};

export default function DeviceActionModal({
  action,
  device,
  request,
  onResult,
  renderOnResult,
  onModalHide,
  onSelectDeviceLink,
  analyticsPropertyFlow,
}: Props) {
  const { t } = useTranslation();
  const showAlert = !device?.wired;
  const [result, setResult] = useState<any | null>(null);

  const handleModalHide = useCallback(() => {
    if (onModalHide) onModalHide();
    if (onResult && result) {
      onResult(result);
      setResult(null);
    }
  }, [onModalHide, onResult, result]);

  return (
    <BottomModal
      id="DeviceActionModal"
      isOpened={result ? false : !!device}
      onModalHide={handleModalHide}
    >
      {onResult && result
        ? null
        : device && (
            <Flex>
              <DeviceActionContainer marginBottom={showAlert ? "16px" : 0}>
                <DeviceAction
                  action={action}
                  device={device}
                  request={request}
                  onResult={onResult ? p => setResult(p) : undefined}
                  renderOnResult={renderOnResult}
                  onSelectDeviceLink={onSelectDeviceLink}
                  analyticsPropertyFlow={analyticsPropertyFlow}
                />
              </DeviceActionContainer>
              {showAlert && (
                <Alert type="info" title={t("DeviceAction.stayInTheAppPlz")} />
              )}
            </Flex>
          )}
      {device && <SyncSkipUnderPriority priority={100} />}
    </BottomModal>
  );
}
