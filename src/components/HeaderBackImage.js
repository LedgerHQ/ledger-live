/* @flow */
import React from "react";
import { View, Platform } from "react-native";
import ArrowLeft from "../images/icons/ArrowLeft";
import colors from "../colors";

const HeaderBackImage = () => {
  const paddingLeft = Platform.OS === "ios" ? 16 : 3;

  return (
    <View style={{ paddingLeft }}>
      <ArrowLeft size={16} color={colors.darkBlue} />
    </View>
  );
};

export default HeaderBackImage;
