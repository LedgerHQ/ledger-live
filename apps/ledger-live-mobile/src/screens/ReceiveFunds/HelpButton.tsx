import React, { useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { HelpMedium } from "@ledgerhq/native-ui/assets/icons";
import { Box } from "@ledgerhq/native-ui";
import { track } from "../../analytics";

const HelpButton = () => {
  const onClickButton = useCallback(() => {
    track("button_clicked", {
      button: "Choose a network article",
    });
  }, []);
  return (
    <Box mr={6}>
      <TouchableOpacity onPress={onClickButton}>
        <HelpMedium size={24} color={"neutral.c100"} />
      </TouchableOpacity>
    </Box>
  );
};

export default HelpButton;
