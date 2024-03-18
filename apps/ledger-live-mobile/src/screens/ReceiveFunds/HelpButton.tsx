import React, { useCallback } from "react";
import { Linking, TouchableOpacity } from "react-native";
import { HelpMedium } from "@ledgerhq/native-ui/assets/icons";
import { Box } from "@ledgerhq/native-ui";
import { track } from "~/analytics";

type Props = {
  url: string;
  eventButton: string;
};
const HelpButton = ({ url, eventButton }: Props) => {
  const onClickButton = useCallback(() => {
    track("button_clicked", {
      button: eventButton,
      type: "{?}",
    });
    Linking.openURL(url);
  }, [url, eventButton]);

  return (
    <Box mr={4}>
      <TouchableOpacity onPress={onClickButton}>
        <HelpMedium size={24} color={"neutral.c100"} />
      </TouchableOpacity>
    </Box>
  );
};

export default HelpButton;
