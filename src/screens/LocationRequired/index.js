// @flow

import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { Trans, translate } from "react-i18next";
import NoLocationImage from "../../icons/NoLocationImage";
import LocationServicesButton from "./LocationServicesButton";
import AppPermissionsButton from "./AppPermissionsButton";
import LText from "../../components/LText";
import colors from "../../colors";

class LocationRequired extends PureComponent<{
  onRetry: Function,
  errorType: "disabled" | "unauthorized",
}> {
  render() {
    const { errorType, onRetry } = this.props;

    return (
      <View style={styles.container}>
        <NoLocationImage />
        <View>
          <LText bold secondary style={styles.title}>
            <Trans i18nKey="location.required" />
          </LText>
        </View>
        <View>
          <LText style={styles.desc}>
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
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: colors.darkBlue,
    fontSize: 18,
    marginTop: 24,
  },
  desc: {
    color: colors.grey,
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

export default translate()(LocationRequired);
