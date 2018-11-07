// @flow

import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import NoLocationImage from "./assets/NoLocationImage";
import LocationServicesButton from "./LocationServicesButton";
import AppPermissionsButton from "./AppPermissionsButton";
import LText from "../../components/LText";
import colors from "../../colors";

export default class LocationRequired extends PureComponent<{
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
            Location required
          </LText>
        </View>
        <View>
          <LText style={styles.desc}>
            It seems location detection is disabled on your mobile. Go to
            settings and enable location to activate bluetooth.
          </LText>
          <LText style={styles.desc}>
            Lorem Elsass ipsum Racing. hopla Verdammi purus lotto-owe Huguette
            sit schnaps porta placerat Pfourtz !
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
  buttonWrapper: {
    alignSelf: "stretch",
    paddingHorizontal: 36,
    marginTop: 24,
  },
});
