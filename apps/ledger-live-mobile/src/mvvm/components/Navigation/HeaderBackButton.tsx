import React from "react";
import { IconButton } from "@ledgerhq/lumen-ui-rnative";
import { ArrowLeft } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "~/context/Locale";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";

type HeaderBackButtonProps = {
  testID?: string;
  overrideOnPress?: () => void;
  track?: () => void;
};

const HeaderBackButton = ({ testID, overrideOnPress, track }: Readonly<HeaderBackButtonProps>) => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const handlePress = () => {
    if (overrideOnPress) {
      overrideOnPress();
    } else {
      track?.();
      navigation.goBack();
    }
  };

  return (
    <IconButton
      appearance="no-background"
      lx={buttonStyle}
      size="md"
      icon={ArrowLeft}
      testID={testID}
      accessibilityLabel={t("common.back")}
      onPress={handlePress}
    />
  );
};

const buttonStyle: LumenViewStyle = {
  marginLeft: "-s4",
};

export default HeaderBackButton;
