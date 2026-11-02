import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Edge } from "react-native-safe-area-context";
import { useTranslation } from "~/context/Locale";
import { useTheme } from "@react-navigation/native";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { AppResult } from "@ledgerhq/live-common/hw/actions/app";
import type { PerpsSignResult } from "@ledgerhq/live-common/wallet-api/Perps/server";
import type { SetHeaderOptionsRequest } from "~/components/SelectDevice2";
import { useAppDeviceAction } from "~/hooks/deviceActions";
import type { RootComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { NavigatorName, ScreenName } from "~/const";

type NavigationProps = RootComposite<
  StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.PerpsSign>
>;

type AppDeviceAction = ReturnType<typeof useAppDeviceAction>;

// The screen has no navigation header by default, so it owns the top inset until SelectDevice2
// shows a header (BLE pairing flow).
const EDGES_WITHOUT_HEADER: Edge[] = ["top", "bottom"];
const EDGES_WITH_HEADER: Edge[] = ["bottom"];

export type PerpsSignViewModel = {
  t: ReturnType<typeof useTranslation>["t"];
  backgroundColor: string;
  safeAreaEdges: Edge[];
  theme: "dark" | "light";
  selectedDevice: Device | null | undefined;
  connectedDevice: Device | null;
  drawerOpen: boolean;
  action: AppDeviceAction;
  request: {
    appName: string | undefined;
    requireLatestFirmware?: boolean;
    allowPartialDependencies?: boolean;
    skipAppInstallIfNotFound?: boolean;
  };
  setSelectedDevice: (device: Device | null | undefined) => void;
  handleAppResult: (result: AppResult) => void;
  handleDrawerClose: () => void;
  handleDrawerHidden: () => void;
  handleOpenManager: () => void;
  requestToSetHeaderOptions: (req: SetHeaderOptionsRequest) => void;
};

export function usePerpsSignViewModel({ navigation, route }: NavigationProps): PerpsSignViewModel {
  const { t } = useTranslation();
  const { colors, dark } = useTheme();
  const theme: "dark" | "light" = dark ? "dark" : "light";
  const { appName, appOptions, signFactory, onSuccess, onError, onCancel } = route.params;

  const [selectedDevice, setSelectedDevice] = useState<Device | null | undefined>();
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [isHeaderShown, setIsHeaderShown] = useState(false);
  const completedRef = useRef(false);
  const navigatingToManagerRef = useRef(false);

  const action = useAppDeviceAction();
  const request = useMemo(
    () => ({
      appName,
      requireLatestFirmware: appOptions?.requireLatestFirmware,
      allowPartialDependencies: appOptions?.allowPartialDependencies,
      skipAppInstallIfNotFound: appOptions?.skipAppInstallIfNotFound,
    }),
    [appName, appOptions],
  );

  const drawerOpen = !!selectedDevice;

  const handleAppResult = useCallback((result: AppResult) => {
    setConnectedDevice(result.device);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setConnectedDevice(null);
    setSelectedDevice(undefined);
    if (!completedRef.current) {
      completedRef.current = true;
      onCancel();
    }
  }, [onCancel]);

  const handleDrawerHidden = useCallback(() => {
    if (completedRef.current && !navigatingToManagerRef.current) {
      navigation.goBack();
    }
  }, [navigation]);

  const requestToSetHeaderOptions = useCallback(
    (req: SetHeaderOptionsRequest) => {
      setIsHeaderShown(req.type === "set");
      if (req.type === "set") {
        navigation.setOptions({
          headerShown: true,
          headerLeft: req.options.headerLeft,
          headerRight: req.options.headerRight,
        });
      } else {
        navigation.setOptions({
          headerShown: false,
          headerLeft: () => null,
          headerRight: () => null,
        });
      }
    },
    [navigation],
  );

  useEffect(() => {
    if (!connectedDevice) return;

    let cancelled = false;

    signFactory(connectedDevice)
      .then((result: PerpsSignResult) => {
        if (cancelled) return;
        completedRef.current = true;
        onSuccess(result);
        setSelectedDevice(undefined);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        completedRef.current = true;
        const e = err instanceof Error ? err : new Error(String(err));
        onError(e);
        setSelectedDevice(undefined);
      });

    return () => {
      cancelled = true;
    };
  }, [connectedDevice, signFactory, onSuccess, onError]);

  const handleOpenManager = useCallback(() => {
    completedRef.current = true;
    navigatingToManagerRef.current = true;
    navigation.replace(NavigatorName.MyLedger, {
      screen: ScreenName.MyLedgerChooseDevice,
      params: { searchQuery: appName },
    });
  }, [navigation, appName]);

  useEffect(() => {
    return () => {
      if (!completedRef.current) {
        onCancel();
      }
    };
  }, [onCancel]);

  return {
    t,
    backgroundColor: colors.background,
    safeAreaEdges: isHeaderShown ? EDGES_WITH_HEADER : EDGES_WITHOUT_HEADER,
    theme,
    selectedDevice,
    connectedDevice,
    drawerOpen,
    action,
    request,
    setSelectedDevice,
    handleAppResult,
    handleDrawerClose,
    handleDrawerHidden,
    handleOpenManager,
    requestToSetHeaderOptions,
  };
}
