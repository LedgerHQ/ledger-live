import React from "react";
import { TouchableOpacity } from "react-native";
import { useNavigation, useTheme } from "@react-navigation/native";
import IconQuestion from "../../icons/Question";
import { ScreenName } from "../../const";

const HelpButton = () => {
  const { navigate } = useNavigation();
  const { colors } = useTheme();
  return (
    <>
      <TouchableOpacity
        style={{ marginRight: 16 }}
        onPress={() => navigate(ScreenName.Resources)}
      >
        <IconQuestion size={18} color={colors.grey} />
      </TouchableOpacity>
    </>
  );
};

export default HelpButton;
