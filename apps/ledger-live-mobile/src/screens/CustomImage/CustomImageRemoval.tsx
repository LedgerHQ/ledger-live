import React, { useState } from "react";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { CustomImageNavigatorParamList } from "~/components/RootNavigator/types/CustomImageNavigator";
import { ScreenName } from "~/const";
import { useRemoveImageDeviceAction } from "~/hooks/deviceActions";
import { useCallback, useMemo } from "react";
import { ImageDoesNotExistOnDevice } from "@ledgerhq/live-common/errors";
import { HOOKS_TRACKING_LOCATIONS } from "~/analytics/hooks/variables";
import { useTranslation } from "react-i18next";
import DeviceAction from "~/components/DeviceAction";
import { Button, Flex, Icons } from "@ledgerhq/native-ui";
import { GenericInformationBody } from "~/components/GenericInformationBody";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import GenericErrorView from "~/components/GenericErrorView";

type NavigationProps = BaseComposite<
  StackNavigatorProps<CustomImageNavigatorParamList, ScreenName.CustomImageRemoval>
>;

export function CustomImageRemoval({ route }: NavigationProps) {
  const { device, referral, setDeviceHasImage } = route.params;

  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { t } = useTranslation();

  const action = useRemoveImageDeviceAction();

  const request = useMemo(() => ({ deviceId: device?.deviceId || "", request: {} }), [device]);

  const navigation = useNavigation();

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleTryAgain = useCallback(() => {
    setError(null);
  }, []);

  const onSuccess = useCallback(() => {
    // TODO:
    setDeviceHasImage?.(false);
    setIsSuccess(true);
  }, [setDeviceHasImage]);

  const onError = useCallback(
    (error: Error) => {
      if (error instanceof ImageDoesNotExistOnDevice) {
        setDeviceHasImage?.(false);
      }
      setError(error);
    },
    [setDeviceHasImage],
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Flex flex={1} p={6}>
        {isSuccess ? (
          <>
            <Flex flex={1} justifyContent="center">
              <GenericInformationBody
                Icon={Icons.CheckmarkCircleFill}
                iconColor="success.c60"
                title={t("customImage.toastRemove")}
              />
            </Flex>
            <Button type="main" size="large" onPress={handleClose}>
              {t("common.close")}
            </Button>
          </>
        ) : error ? (
          <>
            <Flex flex={1} justifyContent="center">
              <GenericErrorView error={error} hasExportLogButton={false} />
            </Flex>
            {!(error instanceof ImageDoesNotExistOnDevice) && (
              <Button type="main" size="large" onPress={handleTryAgain} my={4}>
                {t("common.tryAgain")}
              </Button>
            )}
            <Button type="main" outline size="large" onPress={handleClose}>
              {t("common.close")}
            </Button>
          </>
        ) : (
          <DeviceAction
            device={device}
            request={request}
            action={action}
            onResult={onSuccess}
            onError={onError}
            location={
              referral === HOOKS_TRACKING_LOCATIONS.myLedgerDashboard
                ? HOOKS_TRACKING_LOCATIONS.myLedgerDashboard
                : undefined
            }
          />
        )}
      </Flex>
    </SafeAreaView>
  );
}
