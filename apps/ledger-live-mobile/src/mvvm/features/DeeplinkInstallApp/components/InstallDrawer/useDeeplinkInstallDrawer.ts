import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import VersionNumber from "react-native-version-number";
import { track } from "~/analytics";
import { ScreenName, NavigatorName } from "~/const";
import { BaseNavigation } from "~/components/RootNavigator/types/helpers";
import {
  deeplinkInstallAppDrawerSelector,
  deeplinkInstallAppSelector,
  selectSelectedDevice,
  closeDeeplinkInstallAppDrawer,
  setSelectedDevice,
} from "~/reducers/deeplinkInstallApp";
import { getAppInstallConfig } from "../../constants/appInstallMap";

export type InstallStep = "confirmation" | "installing" | "success" | "error";

export function useDeeplinkInstallDrawer() {
  const dispatch = useDispatch();
  const navigation = useNavigation<BaseNavigation>();

  const isOpen = useSelector(deeplinkInstallAppDrawerSelector);
  const appToInstall = useSelector(deeplinkInstallAppSelector);
  const selectedDevice = useSelector(selectSelectedDevice);

  const [step, setStep] = useState<InstallStep>("confirmation");
  const [installError, setInstallError] = useState<Error | null>(null);
  const [installKey, setInstallKey] = useState(0);

  const appConfig = useMemo(
    () => (appToInstall ? getAppInstallConfig(appToInstall) : null),
    [appToInstall],
  );

  useEffect(() => {
    if (isOpen && appConfig && selectedDevice) {
      setStep("installing");
      setInstallError(null);
      setInstallKey(prev => prev + 1);
    }
  }, [isOpen, appConfig, selectedDevice]);

  useEffect(() => {
    if (isOpen && !appConfig) {
      dispatch(closeDeeplinkInstallAppDrawer());
    }
  }, [isOpen, appConfig, dispatch]);

  const handleClose = useCallback(() => {
    setStep("confirmation");
    setInstallError(null);
    dispatch(setSelectedDevice(null));
    dispatch(closeDeeplinkInstallAppDrawer());
  }, [dispatch]);

  const handleConfirm = useCallback(() => {
    if (!appToInstall) return;

    track("button_clicked", {
      button: `Install ${appConfig?.displayName}`,
      source: "Universal Link",
      device: selectedDevice?.modelId,
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
  }, [dispatch, navigation, appToInstall, appConfig, selectedDevice]);

  const handleRetry = useCallback(() => {
    setStep("confirmation");
    setInstallError(null);
    dispatch(setSelectedDevice(null));
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
    dispatch(setSelectedDevice(null));
  }, [dispatch]);

  const handleInstallError = useCallback(
    (error: Error) => {
      setInstallError(error);
      setStep("error");
      dispatch(setSelectedDevice(null));
    },
    [dispatch],
  );

  return {
    isOpen,
    step,
    device: selectedDevice,
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
