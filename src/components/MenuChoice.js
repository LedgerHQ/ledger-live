/* @flow */
import React, { Component } from "react";
import { TouchableOpacity, Image, View, Text, StyleSheet } from "react-native";

export default class MenuTitle extends Component<{
  onPress: *,
  icon: *,
  title: *,
  description: *
}> {
  render() {
    const { icon, title, description, onPress } = this.props;
    return (
      <TouchableOpacity onPress={onPress}>
        <View style={styles.root}>
          <View style={styles.left}>
            <Image style={styles.img} source={icon} />
          </View>
          <View style={styles.body}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
    alignItems: "center"
  },
  left: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20
  },
  img: {
    width: 20,
    height: 20
  },
  body: {
    flexDirection: "column"
  },
  title: {
    fontWeight: "bold",
    fontSize: 12
  },
  description: {
    fontSize: 12
  }
});
