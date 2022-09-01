import React from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import NoLocationImage from "../../icons/NoLocationImage";
import LocationServicesButton from "./LocationServicesButton";
import AppPermissionsButton from "./AppPermissionsButton";
import LText from "../../components/LText";

type Props = {
  onRetry: (..._: Array<any>) => any;
  errorType: "disabled" | "unauthorized";
};
const LocationRequired: React.FC<Props> = ({ errorType, onRetry }) => (
  <View style={styles.container}>
    <NoLocationImage />
    <View>
      <LText bold secondary style={styles.title}>
        <Trans i18nKey="location.required" />
      </LText>
    </View>
    <View>
      <LText style={styles.desc} color="grey">
        <Trans i18nKey="location.disabled" />
      </LText>
      <LText semiBold style={[styles.desc, styles.descPadding]}>
        <Trans i18nKey="location.noInfos" />
      </LText>
    </View>
    <View style={styles.buttonWrapper}>
      {errorType === "disabled" ? (
        <LocationServicesButton onRetry={onRetry} />
      ) : (
        <AppPermissionsButton onRetry={onRetry} />
      )}
    </View>
  </View>
);

export default LocationRequired;

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
