import React, { useCallback, useState } from "react";
import { View, StyleSheet, PermissionsAndroid } from "react-native";
import { useTranslation } from "react-i18next";
import { Button } from "@ledgerhq/native-ui";
import NoLocationImage from "../../icons/NoLocationImage";
import LocationServicesButton from "./LocationServicesButton";
import OpenAppPermissionsSettingsButton from "./OpenAppPermissionsSettingsButton";
import LText from "../LText";
import {
  locationPermission,
  requestLocationPermission,
  RequestResult,
} from "../RequiresBLE/androidBlePermissions";

const { RESULTS } = PermissionsAndroid;

type Props = {
  onRetry: () => void;
  errorType: "disabled" | "unauthorized";
};
export default function LocationRequired({ errorType, onRetry }: Props) {
  const { t } = useTranslation();
  const [requestResult, setRequestResult] = useState<RequestResult | null>(
    null,
  );
  const { status } = requestResult || {};

  /** https://developer.android.com/about/versions/11/privacy/permissions#dialog-visibility */
  const neverAskAgain = status === RESULTS.NEVER_ASK_AGAIN;

  const requestPermission = useCallback(async () => {
    let dead = false;
    requestLocationPermission().then(res => {
      if (dead) return;
      setRequestResult(res);
      onRetry();
    });
    return () => {
      dead = true;
    };
  }, [onRetry]);

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
          <OpenAppPermissionsSettingsButton onRetry={onRetry} />
        ) : (
          <Button type="main" outline onPress={requestPermission}>
            {t("permissions.authorize")}
          </Button>
        )}
      </View>
    </View>
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
