/* @flow */
import React from "react";
import { View, Platform } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import colors from "../colors";

const HeaderBackImage = () => {
  const paddingLeft = Platform.OS === "ios" ? 16 : 3;

  return (
    <View style={{ paddingLeft }}>
      <Icon name="arrow-back" size={22} color={colors.darkBlue} />
    </View>
  );
};

export default HeaderBackImage;
