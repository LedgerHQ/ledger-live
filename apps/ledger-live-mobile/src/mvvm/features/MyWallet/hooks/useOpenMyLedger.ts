import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { identitiesSlice } from "@domain/entity-client-identity";
import { createIntent, type DeviceConnectionParams } from "@features/platform-device-intent";
import type {
  OpenMyLedgerIntent,
  OpenMyLedgerIntentInput,
  OpenMyLedgerIntentResult,
} from "@ledgerhq/live-common/intents/openMyLedgerIntent";
import type { InitializationInput } from "LLM/components/DeviceIntentExecutor";
import { useResolveOsUpdatesStep } from "LLM/features/OsUpdate/hooks/useResolveOsUpdates/useResolveOsUpdatesStep";
import { setLastSeenDeviceInfo } from "~/actions/settings";
import { NavigatorName, ScreenName } from "~/const";
import { useDispatch } from "~/context/hooks";
import { openMyLedgerIntentPlatformDefinition } from "../deviceIntents/openMyLedgerIntent/intentPlatformDefinition";

const DEVICE_CONNECTION_PARAMS: DeviceConnectionParams = { acceptedDeviceModelIds: [] };

const DASHBOARD_INITIALIZATION_INPUT: InitializationInput = {
  appName: "BOLOS",
  dependencies: [],
  requireLatestFirmware: false,
};

type UseOpenMyLedgerParams = Readonly<{
  firmwareUpdate?: boolean;
  searchQuery?: string;
}>;

/** Runs the open My Ledger intent in the DIE, then navigates to My Ledger once the sheet is hidden. */
export function useOpenMyLedger({ firmwareUpdate, searchQuery }: UseOpenMyLedgerParams) {
  const navigation =
    useNavigation<NativeStackNavigationProp<{ [key: string]: object | undefined }>>();
  const dispatch = useDispatch();
  const resolveOsUpdates = useResolveOsUpdatesStep();
  const resolveOsUpdatesRef = useRef(resolveOsUpdates);
  useEffect(() => {
    resolveOsUpdatesRef.current = resolveOsUpdates;
  }, [resolveOsUpdates]);

  const [intent, setIntent] = useState<OpenMyLedgerIntent>();
  const [isSheetRequested, setIsSheetRequested] = useState(false);
  const resultRef = useRef<OpenMyLedgerIntentResult | undefined>(undefined);

  const start = useCallback(() => {
    resultRef.current = undefined;
    const input: OpenMyLedgerIntentInput = { resolveOsUpdates: resolveOsUpdatesRef.current };
    setIntent(
      createIntent(openMyLedgerIntentPlatformDefinition, input, {
        onResult: result => {
          resultRef.current = result;
          if (result.deviceId) {
            dispatch(identitiesSlice.actions.addDeviceId(result.deviceId));
          }
          dispatch(
            setLastSeenDeviceInfo({
              modelId: result.device.modelId,
              deviceInfo: result.deviceInfo,
              apps: [],
            }),
          );
          setIsSheetRequested(false);
        },
      }),
    );
    setIsSheetRequested(true);
  }, [dispatch]);

  const onUserCancel = useCallback(() => {
    setIsSheetRequested(false);
  }, []);

  const onDeviceSheetDismissed = useCallback(() => {
    const result = resultRef.current;
    resultRef.current = undefined;
    setIntent(undefined);
    if (result) {
      navigation.navigate(NavigatorName.MyLedger, {
        screen: ScreenName.MyLedgerDevice,
        params: {
          device: result.device,
          deviceInfo: result.deviceInfo,
          result: result.result,
          firmwareUpdate,
          searchQuery,
        },
      });
    }
  }, [navigation, firmwareUpdate, searchQuery]);

  return {
    start,
    isRunning: intent !== undefined,
    executorProps: intent && {
      intent,
      isRequestingToBeOpened: isSheetRequested,
      onUserCancel,
      onDeviceSheetDismissed,
      deviceConnectionParams: DEVICE_CONNECTION_PARAMS,
      deviceInitializationInput: DASHBOARD_INITIALIZATION_INPUT,
    },
  };
}
