import React from "react";
import { PreChecksStateType, type PreChecksState } from "@ledgerhq/live-dmk-shared";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import type { OsUpdateSheetSpec, OsUpdateStepLayoutSpec } from "..";
import { OsUpdateButton } from "../../../analytics/types";
import { PreparingScreen } from "../../PreparingScreen";
import { BatteryTooLowContent } from "../../../sheets/BatteryTooLowContent";
import { DeviceDisconnectedContent } from "../../../sheets/DeviceDisconnectedContent";
import { DeviceLockedContent } from "../../../sheets/DeviceLockedContent";
import { UnexpectedErrorContent } from "../../../sheets/UnexpectedErrorContent";

type Props = Readonly<{
  state: PreChecksState;
  deviceModelId: DeviceModelId;
  deviceName: string;
  productName: string;
  trackClick: (button: OsUpdateButton) => void;
}>;

function getSheet({
  state,
  deviceModelId,
  deviceName,
  productName,
  trackClick,
}: Props): OsUpdateSheetSpec | undefined {
  switch (state.type) {
    case PreChecksStateType.LOADING:
      return undefined;
    case PreChecksStateType.DEVICE_LOCKED:
      return {
        content: <DeviceLockedContent deviceModelId={deviceModelId} deviceName={deviceName} />,
      };
    case PreChecksStateType.DEVICE_DISCONNECTED:
      return { content: <DeviceDisconnectedContent /> };
    case PreChecksStateType.BATTERY_TOO_LOW: {
      const onCancel = () => {
        trackClick(OsUpdateButton.CANCEL);
        state.cancel();
      };
      return {
        content: (
          <BatteryTooLowContent
            productName={productName}
            percentage={state.currentPercentage}
            onCancel={onCancel}
          />
        ),
      };
    }
    case PreChecksStateType.UNEXPECTED_ERROR: {
      const onCancel = () => {
        trackClick(OsUpdateButton.CANCEL);
        state.cancel();
      };
      return {
        content: <UnexpectedErrorContent onCancel={onCancel} />,
      };
    }
    default: {
      const unhandled: never = state;
      return unhandled;
    }
  }
}

export function getPreChecksLayout(props: Props): OsUpdateStepLayoutSpec {
  return { screen: <PreparingScreen />, sheet: getSheet(props) };
}
