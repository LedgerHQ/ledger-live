/* @flow */
import React, { Component } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import colors from "../colors";

class EditPersonalInfo extends Component<*> {
  static navigationOptions = {
    title: "Personal info"
  };
  onOpenActionSheet = () => {
    // TODO probably use https://github.com/react-community/react-native-image-picker
  };
  render() {
    return (
      <View style={styles.container}>
        <View style={styles.header} />
        <View style={styles.body}>
          <TouchableOpacity onPress={this.onOpenActionSheet}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: "black", borderRadius: 50 }
              ]}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    backgroundColor: colors.blue,
    height: 100
  },
  body: {
    marginTop: -50,
    alignItems: "center"
  },
  avatar: {
    width: 100,
    height: 100
  }
});

export default EditPersonalInfo;
