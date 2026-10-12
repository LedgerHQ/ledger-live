import React from "react";
import { PreChecksStateType, type PreChecksState } from "@ledgerhq/live-dmk-shared";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import { InfoState } from "@shared/ui-info-state";
import { Trans } from "~/context/Locale";
import type { OsUpdateSheetSpec, OsUpdateStepLayoutSpec } from "..";
import { PreparingScreen } from "../../PreparingScreen";
import { DeviceDisconnectedContent } from "../../../sheets/DeviceDisconnectedContent";
import { DeviceLockedContent } from "../../../sheets/DeviceLockedContent";
import { UnexpectedErrorContent } from "../../../sheets/UnexpectedErrorContent";

type Props = Readonly<{
  state: PreChecksState;
  deviceModelId: DeviceModelId;
  deviceName: string;
  productName: string;
}>;

function getSheet({
  state,
  deviceModelId,
  deviceName,
  productName,
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
    case PreChecksStateType.BATTERY_TOO_LOW:
      return {
        content: (
          <InfoState
            preset="info"
            size="hug"
            title={<Trans i18nKey="osUpdates.batteryTooLow.title" values={{ productName }} />}
            description={
              <Trans
                i18nKey="osUpdates.batteryTooLow.description"
                values={{ percentage: state.currentPercentage }}
              />
            }
            primaryCta={{
              label: <Trans i18nKey="osUpdates.actions.cancel" />,
              onPress: state.cancel,
            }}
            testID="os-update-battery-too-low"
          />
        ),
      };
    case PreChecksStateType.UNEXPECTED_ERROR:
      return {
        content: <UnexpectedErrorContent onCancel={state.cancel} />,
      };
    default: {
      const unhandled: never = state;
      return unhandled;
    }
  }
}

export function getPreChecksLayout(props: Props): OsUpdateStepLayoutSpec {
  return { screen: <PreparingScreen />, sheet: getSheet(props) };
}
