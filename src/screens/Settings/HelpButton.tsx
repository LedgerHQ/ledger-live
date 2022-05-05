import React from "react";
import { TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { HelpMedium } from "@ledgerhq/native-ui/assets/icons";
import { Box } from "@ledgerhq/native-ui";
import { ScreenName } from "../../const";

const HelpButton = () => {
  const { navigate } = useNavigation();
  return (
    <Box mr={6}>
      <TouchableOpacity onPress={() => navigate(ScreenName.Resources)}>
        <HelpMedium size={24} color={"neutral.c100"} />
      </TouchableOpacity>
    </Box>
  );
};

export default HelpButton;
