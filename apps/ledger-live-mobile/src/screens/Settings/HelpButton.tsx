import React from "react";
import { TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { HelpMedium } from "@ledgerhq/native-ui/assets/icons";
import { Box } from "@ledgerhq/native-ui";
import { ScreenName } from "~/const";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";

const HelpButton = () => {
  const { navigate } = useNavigation<StackNavigatorNavigation<SettingsNavigatorStackParamList>>();
  return (
    <Box mr={6}>
      <TouchableOpacity onPress={() => navigate(ScreenName.Resources)}>
        <HelpMedium size={24} color={"neutral.c100"} />
      </TouchableOpacity>
    </Box>
  );
};

export default HelpButton;
