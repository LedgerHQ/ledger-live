import React, { useCallback } from "react";
import { Linking, TouchableOpacity } from "react-native";
import { HelpMedium } from "@ledgerhq/native-ui/assets/icons";
import { Box } from "@ledgerhq/native-ui";
import { track } from "../../analytics";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";

const HelpButton = () => {
  const depositNetworkBannerMobile = useFeature("depositNetworkBannerMobile");

  const onClickButton = useCallback(() => {
    track("button_clicked", {
      button: "Choose a network article",
    });
    Linking.openURL(depositNetworkBannerMobile?.params.url);
  }, [depositNetworkBannerMobile?.params.url]);

  return depositNetworkBannerMobile?.enabled ? (
    <Box mr={6}>
      <TouchableOpacity onPress={onClickButton}>
        <HelpMedium size={24} color={"neutral.c100"} />
      </TouchableOpacity>
    </Box>
  ) : null;
};

export default HelpButton;
