import { track } from "@shared/analytics";
import React, { useCallback } from "react";
import { Linking, TouchableOpacity } from "react-native";
import { HelpMedium } from "@ledgerhq/native-ui/assets/icons";
import { Flex } from "@ledgerhq/native-ui";

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
    <TouchableOpacity onPress={onClickButton}>
      <Flex width={40} height={40} alignItems="center" justifyContent="center">
        <HelpMedium size={24} color={"neutral.c100"} />
      </Flex>
    </TouchableOpacity>
  );
};

export default HelpButton;
