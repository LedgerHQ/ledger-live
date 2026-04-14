import React from "react";
import { IconButton } from "@ledgerhq/lumen-ui-rnative";
import { ArrowLeft } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "~/context/Locale";

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
      size="md"
      icon={ArrowLeft}
      testID={testID}
      accessibilityLabel={t("common.back")}
      onPress={handlePress}
    />
  );
};

export default HeaderBackButton;
