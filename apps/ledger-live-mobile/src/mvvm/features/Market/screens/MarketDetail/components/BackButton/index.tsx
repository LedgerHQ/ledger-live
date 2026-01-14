import React from "react";
import { IconsLegacy } from "@ledgerhq/native-ui";
import Button from "~/components/wrappedUi/Button";
import { useNavigation } from "@react-navigation/native";

function BackButton() {
  const navigation = useNavigation();
  return (
    <Button
      size="large"
      onPress={() => navigation.goBack()}
      Icon={IconsLegacy.ArrowLeftMedium}
      testID="market-back-btn"
    />
  );
}

export default BackButton;
