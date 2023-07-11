import React, { useCallback } from "react";
import { Linking, TouchableOpacity } from "react-native";
import { HelpMedium } from "@ledgerhq/native-ui/assets/icons";
import { Box } from "@ledgerhq/native-ui";
import { track } from "../../analytics";

type Props = {
  enabled: boolean;
  url: string;
};
const HelpButton = ({ enabled, url }: Props) => {
  const onClickButton = useCallback(() => {
    track("button_clicked", {
      button: "Choose a network article",
    });
    Linking.openURL(url);
  }, [url]);

  return enabled ? (
    <Box mr={4}>
      <TouchableOpacity onPress={onClickButton}>
        <HelpMedium size={24} color={"neutral.c100"} />
      </TouchableOpacity>
    </Box>
  ) : null;
};

export default HelpButton;
