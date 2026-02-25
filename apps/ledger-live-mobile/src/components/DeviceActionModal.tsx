import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import { Action, Device } from "@ledgerhq/live-common/hw/actions/types";
import { Alert, Flex } from "@ledgerhq/native-ui";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "~/context/Locale";
import styled from "styled-components/native";
import { PartialNullable } from "~/types/helpers";
import QueuedDrawer from "./QueuedDrawer";
import DeviceAction from "./DeviceAction";
import { HOOKS_TRACKING_LOCATIONS } from "~/analytics/hooks/variables";
import { PeerRemovedPairing } from "@ledgerhq/errors";

const DeviceActionContainer = styled(Flex).attrs({
  flexDirection: "row",
})``;

type Props<Req, Stt, Res> = {
  action: Action<Req, Stt, Res>;
  device: Device | null | undefined;
  request?: Req;
  location?: HOOKS_TRACKING_LOCATIONS;
  onClose?: () => void;
  onError?: (error: Error) => void;
  onModalHide?: () => void;
  onResult?: (payload: NonNullable<Res>) => Promise<void> | void | null;
  renderOnResult?: (_: Res) => React.JSX.Element | null;
  onSelectDeviceLink?: () => void;
  analyticsPropertyFlow?: string;
  registerDeviceSelection?: (onDeviceUpdated: () => void) => void;
  noCloseButton?: boolean;
  preventBackdropClick?: boolean;
};

export default function DeviceActionModal<Req, Stt, Res>({
  action,
  device,
  request,
  location,
  onClose,
  onResult,
  onError,
  renderOnResult,
  onModalHide,
  onSelectDeviceLink,
  analyticsPropertyFlow,
  registerDeviceSelection,
  noCloseButton,
  preventBackdropClick,
}: Props<Req, Stt, Res>) {
  const { t } = useTranslation();
  const defaultShowInfo = !device?.wired;
  const [showInfo, setShowInfo] = useState<boolean>(defaultShowInfo);
  const [result, setResult] = useState<Res | null>(null);

  const handleModalHide = useCallback(() => {
    setShowInfo(defaultShowInfo);
    if (onModalHide) onModalHide();
    if (onResult && result) {
      onResult(result);
    }
  }, [defaultShowInfo, onModalHide, onResult, result]);

  const handleClose = useCallback(() => {
    setShowInfo(defaultShowInfo);
    if (onClose && !result) {
      onClose();
    }
  }, [defaultShowInfo, onClose, result]);

  useEffect(() => {
    registerDeviceSelection?.(() => setResult(null));
  }, [registerDeviceSelection]);

  const onDeviceActionError = useCallback(
    (e: Error) => {
      if (e instanceof PeerRemovedPairing) {
        setShowInfo(false);
      }
      onError?.(e);
    },
    [onError],
  );

  return (
    <QueuedDrawer
      isRequestingToBeOpened={result ? false : !!device}
      onClose={handleClose}
      onModalHide={handleModalHide}
      noCloseButton={noCloseButton}
      preventBackdropClick={preventBackdropClick}
    >
      {onResult && result
        ? null
        : device && (
            <Flex alignItems="center" testID="device-action-modal">
              <DeviceActionContainer marginBottom={showInfo ? "16px" : 0}>
                <DeviceAction
                  action={action as unknown as Action<Req, PartialNullable<Stt>, Res>}
                  device={device}
                  onError={onDeviceActionError}
                  request={request!}
                  onResult={onResult ? p => setResult(p) : undefined}
                  renderOnResult={renderOnResult}
                  onSelectDeviceLink={onSelectDeviceLink}
                  analyticsPropertyFlow={analyticsPropertyFlow}
                  location={location}
                  onClose={handleClose}
                />
              </DeviceActionContainer>
              {showInfo && <Alert type="info" title={t("DeviceAction.stayInTheAppPlz")} />}
            </Flex>
          )}
      {device && <SyncSkipUnderPriority priority={100} />}
    </QueuedDrawer>
  );
}
