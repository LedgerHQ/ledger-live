// @flow

import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import NoLocationImage from "./assets/NoLocationImage";
import LText from "../../components/LText";
import colors from "../../colors";

export default class LocationRequired extends PureComponent<{}> {
  render() {
    return (
      <View style={styles.container}>
        <NoLocationImage />
        <View>
          <LText bold secondary style={styles.titleFont}>
            Location required
          </LText>
        </View>
        <View>
          <LText style={styles.descFont}>
            It seems location detection is disabled on your mobile. Go to
            settings and enable location to activate bluetooth.
          </LText>
          <LText style={styles.descFont}>
            Lorem Elsass ipsum Racing. hopla Verdammi purus lotto-owe Huguette
            sit schnaps porta placerat Pfourtz !
          </LText>
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
  titleFont: {
    color: colors.darkBlue,
    fontSize: 18,
    marginTop: 24,
  },
  descFont: {
    color: colors.grey,
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 20,
  },
});
