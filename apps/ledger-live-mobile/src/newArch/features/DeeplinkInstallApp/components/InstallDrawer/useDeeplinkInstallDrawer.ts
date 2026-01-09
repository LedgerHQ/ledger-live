import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import VersionNumber from "react-native-version-number";
import { track } from "~/analytics";
import { ScreenName, NavigatorName } from "~/const";
import { BaseNavigation } from "~/components/RootNavigator/types/helpers";
import {
  deeplinkInstallAppDrawerSelector,
  deeplinkInstallAppSelector,
  closeDeeplinkInstallAppDrawer,
} from "~/reducers/deeplinkInstallApp";
import { getAppInstallConfig, AppInstallConfig } from "../../constants/appInstallMap";

export type InstallStep = "confirmation" | "installing" | "success" | "error";

let selectedDeviceRef: Device | null = null;

export function setSelectedDeviceForInstall(device: Device) {
  selectedDeviceRef = device;
}

export function useDeeplinkInstallDrawer() {
  const dispatch = useDispatch();
  const navigation = useNavigation<BaseNavigation>();

  const isOpen = useSelector(deeplinkInstallAppDrawerSelector);
  const appToInstall = useSelector(deeplinkInstallAppSelector);

  const [step, setStep] = useState<InstallStep>("confirmation");
  const [device, setDevice] = useState<Device | null>(null);
  const [installError, setInstallError] = useState<Error | null>(null);
  const [installKey, setInstallKey] = useState(0);

  const appConfig = useMemo(
    () => (appToInstall ? getAppInstallConfig(appToInstall) : null),
    [appToInstall],
  );

  useEffect(() => {
    if (isOpen && appConfig) {
      if (selectedDeviceRef) {
        setDevice(selectedDeviceRef);
        setStep("installing");
        setInstallError(null);
        setInstallKey(prev => prev + 1);
      } else if (step === "confirmation") {
        setDevice(null);
        setInstallError(null);
      }
    }
  }, [isOpen, appConfig, step]);

  useEffect(() => {
    if (isOpen && !appConfig) {
      dispatch(closeDeeplinkInstallAppDrawer());
    }
  }, [isOpen, appConfig, dispatch]);

  const handleClose = useCallback(() => {
    selectedDeviceRef = null;
    setStep("confirmation");
    setDevice(null);
    setInstallError(null);
    dispatch(closeDeeplinkInstallAppDrawer());
  }, [dispatch]);

  const handleConfirm = useCallback(() => {
    if (!appToInstall) return;

    track("button_clicked", {
      button: `Install ${appConfig?.displayName}`,
      source: "Universal Link",
      device: device?.modelId,
      equipmentOS: Platform.OS,
      LLVersion: VersionNumber.appVersion,
    });

    dispatch(closeDeeplinkInstallAppDrawer());
    navigation.navigate(NavigatorName.Base, {
      screen: ScreenName.DeeplinkInstallAppDeviceSelection,
      params: {
        appKey: appToInstall,
      },
    });
  }, [dispatch, navigation, appToInstall, appConfig, device]);

  const handleRetry = useCallback(() => {
    setDevice(null);
    setInstallError(null);
    selectedDeviceRef = null;
    dispatch(closeDeeplinkInstallAppDrawer());
    navigation.navigate(NavigatorName.Base, {
      screen: ScreenName.DeeplinkInstallAppDeviceSelection,
      params: {
        appKey: appToInstall ?? "",
      },
    });
  }, [appToInstall, dispatch, navigation]);

  const handleInstallSuccess = useCallback(() => {
    setStep("success");
    selectedDeviceRef = null;
  }, []);

  const handleInstallError = useCallback((error: Error) => {
    setInstallError(error);
    setStep("error");
    selectedDeviceRef = null;
  }, []);

  return {
    isOpen,
    step,
    device,
    installError,
    installKey,
    appConfig,
    handleClose,
    handleConfirm,
    handleRetry,
    handleInstallSuccess,
    handleInstallError,
  };
}
