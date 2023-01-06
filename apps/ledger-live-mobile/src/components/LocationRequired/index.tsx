import React, { useCallback } from "react";
import { View, StyleSheet, PermissionsAndroid, Linking } from "react-native";
import { useTranslation } from "react-i18next";
import { Button, Icons } from "@ledgerhq/native-ui";
import NoLocationImage from "../../icons/NoLocationImage";
import LocationServicesButton from "./LocationServicesButton";
import LText from "../LText";
import DeviceSetupView from "../DeviceSetupView";
import useAndroidLocationPermission, {
  locationPermission,
} from "../RequiresBLE/hooks/useAndroidLocationPermission";

type Props = {
  onRetry: () => void;
  errorType: "disabled" | "unauthorized";
};
export default function LocationRequired({ errorType, onRetry }: Props) {
  const { t } = useTranslation();
  const { neverAskAgain } = useAndroidLocationPermission();

  const openNativeSettings = useCallback(() => {
    Linking.openSettings();
  }, []);

  const isDisabledErrorType = errorType === "disabled";
  const isFineLocationRequired =
    locationPermission === PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;

  const title = isDisabledErrorType
    ? t("location.titleServiceRequired")
    : isFineLocationRequired
    ? t("location.titlePermissionRequiredPrecise")
    : t("location.titlePermissionRequired");
  const description = isDisabledErrorType
    ? t("location.descriptionServiceRequired")
    : isFineLocationRequired
    ? t("location.descriptionPermissionRequiredPrecise")
    : t("location.descriptionPermissionRequired");

  return (
    <DeviceSetupView hasBackButton>
      <View style={styles.container}>
        <NoLocationImage />
        <View>
          <LText bold secondary style={styles.title}>
            {title}
          </LText>
        </View>
        <View>
          <LText style={styles.desc} color="grey">
            {description}
          </LText>
          <LText semiBold style={[styles.desc, styles.descPadding]}>
            {t("location.noInfos")}
          </LText>
        </View>
        <View style={styles.buttonWrapper}>
          {isDisabledErrorType ? (
            <LocationServicesButton onRetry={onRetry} />
          ) : neverAskAgain ? (
            <Button
              type="main"
              onPress={openNativeSettings}
              Icon={Icons.SettingsMedium}
              outline
            >
              {t("permissions.open")}
            </Button>
          ) : (
            <Button type="main" outline onPress={onRetry}>
              {t("permissions.authorize")}
            </Button>
          )}
        </View>
      </View>
    </DeviceSetupView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    marginTop: 24,
  },
  desc: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 20,
  },
  descPadding: {
    marginTop: 24,
  },
  buttonWrapper: {
    alignSelf: "stretch",
    paddingHorizontal: 36,
    marginTop: 24,
  },
});
