import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import { Action, Device } from "@ledgerhq/live-common/hw/actions/types";
import { Alert, Flex } from "@ledgerhq/native-ui";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components/native";
import { PartialNullable } from "~/types/helpers";
import QueuedDrawer from "./QueuedDrawer";
import DeviceAction from "./DeviceAction";

const DeviceActionContainer = styled(Flex).attrs({
  flexDirection: "row",
})``;

type Props<Req, Stt, Res> = {
  action: Action<Req, Stt, Res>;
  device: Device | null | undefined;
  request?: Req;
  onClose?: () => void;
  onError?: (error: Error) => void;
  onModalHide?: () => void;
  onResult?: (payload: NonNullable<Res>) => Promise<void> | void | null;
  renderOnResult?: (_: Res) => JSX.Element | null;
  onSelectDeviceLink?: () => void;
  analyticsPropertyFlow?: string;
};

export default function DeviceActionModal<Req, Stt, Res>({
  action,
  device,
  request,
  onClose,
  onResult,
  onError,
  renderOnResult,
  onModalHide,
  onSelectDeviceLink,
  analyticsPropertyFlow,
}: Props<Req, Stt, Res>) {
  const { t } = useTranslation();
  const showAlert = !device?.wired;
  const [result, setResult] = useState<Res | null>(null);

  const handleModalHide = useCallback(() => {
    if (onModalHide) onModalHide();
    if (onResult && result) {
      onResult(result);
    }
  }, [onModalHide, onResult, result]);

  const handleClose = useCallback(() => {
    if (onClose && !result) {
      onClose();
    }
  }, [onClose, result]);

  return (
    <QueuedDrawer
      isRequestingToBeOpened={result ? false : !!device}
      onClose={handleClose}
      onModalHide={handleModalHide}
    >
      {onResult && result
        ? null
        : device && (
            <Flex alignItems="center">
              <DeviceActionContainer marginBottom={showAlert ? "16px" : 0}>
                <DeviceAction
                  action={action as unknown as Action<Req, PartialNullable<Stt>, Res>}
                  device={device}
                  onError={onError}
                  request={request!}
                  onResult={onResult ? p => setResult(p) : undefined}
                  renderOnResult={renderOnResult}
                  onSelectDeviceLink={onSelectDeviceLink}
                  analyticsPropertyFlow={analyticsPropertyFlow}
                />
              </DeviceActionContainer>
              {showAlert && <Alert type="info" title={t("DeviceAction.stayInTheAppPlz")} />}
            </Flex>
          )}
      {device && <SyncSkipUnderPriority priority={100} />}
    </QueuedDrawer>
  );
}
