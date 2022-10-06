import React, { ReactNode } from "react";
import { Flex } from "@ledgerhq/native-ui";
import { ArrowLeftMedium, CloseMedium } from "@ledgerhq/native-ui/assets/icons";
import { useNavigation } from "@react-navigation/native";
import { TouchableOpacity } from "react-native-gesture-handler";

export type Props = {
  hasBackButton?: boolean;
  hasCloseButton?: boolean;
  onBack?: () => void;
  onClose?: () => void;
  renderLeft?: () => ReactNode;
  renderRight?: () => ReactNode;
};

const Header = ({
  hasBackButton,
  hasCloseButton,
  onBack,
  onClose,
  renderLeft,
  renderRight,
}: Props) => {
  const navigation = useNavigation();

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <Flex
      px={6}
      pt={8}
      mb={7}
      height={64}
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
    >
      {renderLeft ? (
        renderLeft()
      ) : hasBackButton ? (
        <Flex>
          <TouchableOpacity onPress={onBack || handleBack}>
            <ArrowLeftMedium size={24} />
          </TouchableOpacity>
        </Flex>
      ) : (
        <Flex />
      )}
      {renderRight ? (
        renderRight()
      ) : hasCloseButton ? (
        <Flex>
          <TouchableOpacity onPress={onClose || handleBack}>
            <CloseMedium size={24} />
          </TouchableOpacity>
        </Flex>
      ) : (
        <Flex />
      )}
    </Flex>
  );
};

export default Header;
