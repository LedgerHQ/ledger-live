import { Button, Flex, Link, Text } from "@ledgerhq/native-ui";
import React, { ReactNode, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppState, Linking, PermissionsAndroid } from "react-native";
import { useIsMounted } from "../../helpers/useIsMounted";
import QueuedDrawer from "../QueuedDrawer";
import {
  bluetoothPermissions,
  checkBluetoothPermissions,
  requestBluetoothPermissions,
  RequestMultipleResult,
} from "./androidBlePermissions";
import BluetoothDisabled from "./BluetoothDisabled";

const { RESULTS } = PermissionsAndroid;

/**
 * Renders an error if location is required & not available,
 * otherwise renders children
 */
const AndroidRequiresBluetoothPermissions: React.FC<{
  children?: ReactNode | undefined;
}> = ({ children }) => {
  const { t } = useTranslation();
  const isMounted = useIsMounted();
  const [requestResult, setRequestResult] =
    useState<RequestMultipleResult | null>(null);
  const [checkResult, setCheckResult] = useState<boolean | null>(null);
  const [modalOpened, setModalOpened] = useState(false);

  const { allGranted, generalStatus } = requestResult || {};

  /** https://developer.android.com/about/versions/11/privacy/permissions#dialog-visibility */
  const neverAskAgain = generalStatus === RESULTS.NEVER_ASK_AGAIN;

  const requestPermission = useCallback(() => {
    requestBluetoothPermissions().then(res => {
      if (!isMounted()) return;
      setRequestResult(res);
      if (!res.allGranted) setModalOpened(true);
    });
  }, [isMounted]);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", state => {
      if (state === "active") {
        checkBluetoothPermissions().then(res => {
          if (!isMounted()) return;
          setCheckResult(res);
        });
      }
    });
    return () => {
      subscription.remove();
    };
  }, [isMounted]);

  const closeModal = useCallback(() => {
    setModalOpened(false);
  }, []);
  const showModal = useCallback(() => {
    setModalOpened(true);
  }, []);

  const handleRetry = useCallback(() => {
    neverAskAgain ? Linking.openSettings() : requestPermission();
  }, [neverAskAgain, requestPermission]);

  if (bluetoothPermissions.length === 0) return <>{children}</>;

  if (allGranted || checkResult) return <>{children}</>;
  if (requestResult === null) return null; // suspense PLZ
  return (
    <>
      <BluetoothDisabled onRetry={showModal} />
      <QueuedDrawer
        isRequestingToBeOpened={modalOpened}
        onClose={closeModal}
        noCloseButton
      >
        <Flex flexDirection="row">
          <Flex
            flexDirection="column"
            alignItems="stretch"
            alignSelf="stretch"
            pb={6}
            flexShrink={0}
          >
            <Text variant="h4" fontWeight="semiBold">
              {t("permissions.bluetooth.modalTitle")}
            </Text>
            <Text mt={6} mb={9} variant="body">
              {neverAskAgain
                ? t("permissions.bluetooth.modalDescriptionSettingsVariant")
                : t("permissions.bluetooth.modalDescriptionBase")}
            </Text>
            <Button
              type="main"
              size="large"
              mb={8}
              alignSelf="stretch"
              onPress={handleRetry}
            >
              {neverAskAgain
                ? t("permissions.bluetooth.modalButtonLabelSettingsVariant")
                : t("permissions.bluetooth.modalButtonLabelBase")}
            </Button>
            <Link type="shade" onPress={closeModal}>
              {t("permissions.bluetooth.dontPair")}
            </Link>
          </Flex>
        </Flex>
      </QueuedDrawer>
    </>
  );
};

export default AndroidRequiresBluetoothPermissions;
