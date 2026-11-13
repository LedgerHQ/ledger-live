import { track } from "@shared/analytics";
import React, { useCallback, useEffect, useState } from "react";
import { useIsFocused, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { useUnifiedAddDevice } from "LLM/features/DeviceOnboarding/hooks/useUnifiedAddDevice";
import { ScreenName } from "~/const";
import SelectDevice2, { SetHeaderOptionsRequest } from "~/components/SelectDevice2";
import { useAutoRedirectToPostOnboarding } from "~/hooks/useAutoRedirectToPostOnboarding";
import { DeviceIntentExecutor } from "LLM/components/DeviceIntentExecutor";
import { LNUpsellBanner } from "LLM/features/LNUpsell";
import type { LumenNativeStackNavigationOptions } from "LLM/components/Navigation";
import type { MyWalletNavigatorStackParamList } from "../types";
import { MyWalletHeaderTrailing } from "./Header";
import { useOpenMyLedger } from "../hooks/useOpenMyLedger";

const noop = () => undefined;

type MyLedgerSectionProps = {
  onPairingStateChanged?: (isPairing: boolean) => void;
};

function MyLedgerSectionContent({ onPairingStateChanged }: MyLedgerSectionProps) {
  const [isHeaderOverridden, setIsHeaderOverridden] = useState<boolean>(false);

  useEffect(() => {
    onPairingStateChanged?.(isHeaderOverridden);
  }, [isHeaderOverridden, onPairingStateChanged]);

  const { params } =
    useRoute<RouteProp<MyWalletNavigatorStackParamList, typeof ScreenName.MyWallet>>();

  useAutoRedirectToPostOnboarding();

  const { start, isRunning, executorProps } = useOpenMyLedger({
    firmwareUpdate: params?.firmwareUpdate,
    searchQuery: params?.searchQuery || params?.installApp,
  });

  // Opens My Ledger at once for a device passed via navigation params (e.g. redirect from "not enough space" error during a transactional flow).
  useEffect(() => {
    if (params?.device) start();
  }, [params?.device, start]);

  const navigation =
    useNavigation<NativeStackNavigationProp<{ [key: string]: object | undefined }>>();

  const onAddDevice = useUnifiedAddDevice();

  const onSelectDevice = (selected: Device) => {
    track("ManagerDeviceEntered", {
      modelId: selected.modelId,
    });
    start();
  };

  const requestToSetHeaderOptions = useCallback(
    (request: SetHeaderOptionsRequest) => {
      if (request.type === "set") {
        const HeaderLeft = request.options.headerLeft;
        const opts: Partial<LumenNativeStackNavigationOptions> = {
          lumenNavBar: {
            renderLeading: HeaderLeft
              ? () => (
                  <Box style={{ paddingLeft: 12 }}>
                    <HeaderLeft />
                  </Box>
                )
              : undefined,
            renderTrailing: request.options.headerRight,
            renderCenter: () => null,
          },
        };
        navigation.setOptions(opts);
        setIsHeaderOverridden(true);
      } else {
        const opts: Partial<LumenNativeStackNavigationOptions> = {
          lumenNavBar: {
            renderLeading: undefined,
            renderCenter: () => null,
            renderTrailing: () => <MyWalletHeaderTrailing />,
          },
        };
        navigation.setOptions(opts);
        setIsHeaderOverridden(false);
      }
    },
    [navigation],
  );

  return (
    <>
      <Box style={{ flex: 1 }}>
        <SelectDevice2
          onSelect={onSelectDevice}
          stopBleScanning={isRunning}
          requestToSetHeaderOptions={requestToSetHeaderOptions}
          onAddDevice={onAddDevice}
          withMyLedgerTracking
        >
          <Box lx={{ paddingHorizontal: "s16", paddingTop: "s16" }}>
            <LNUpsellBanner location="profile" />
          </Box>
        </SelectDevice2>
      </Box>
      {executorProps && (
        <DeviceIntentExecutor
          {...executorProps}
          enabled
          intentComponentExtraProps={undefined}
          onExecutorStateChanged={noop}
          cancelIntentRequestId={undefined}
          sourceFlow="my_ledger"
        />
      )}
    </>
  );
}

export function MyLedgerSection({ onPairingStateChanged }: MyLedgerSectionProps) {
  const isFocused = useIsFocused();
  if (!isFocused) return null;
  return <MyLedgerSectionContent onPairingStateChanged={onPairingStateChanged} />;
}
