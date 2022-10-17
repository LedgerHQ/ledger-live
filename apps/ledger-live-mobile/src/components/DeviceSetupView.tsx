import React, { ReactNode } from "react";
import { Flex } from "@ledgerhq/native-ui";
import { ArrowLeftMedium, CloseMedium } from "@ledgerhq/native-ui/assets/icons";
import { useNavigation } from "@react-navigation/native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "styled-components/native";

export type Props = {
  hasBackButton?: boolean;
  hasCloseButton?: boolean;
  onBack?: () => void;
  onClose?: () => void;
  renderLeft?: () => ReactNode;
  renderRight?: () => ReactNode;
  children?: ReactNode;
};

const DeviceSetupView = ({
  hasBackButton,
  hasCloseButton,
  onBack,
  onClose,
  renderLeft,
  renderRight,
  children,
}: Props) => {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const canGoBack = navigation.canGoBack();
  const canRenderBackButton = (canGoBack && hasBackButton) || onBack;
  const canRenderCloseButton = (canGoBack && hasCloseButton) || onClose;

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    // eslint-disable-next-line react-native/no-inline-styles
    <SafeAreaView style={{ flex: 1, background: colors.background.main }}>
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
        ) : canRenderBackButton ? (
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
        ) : canRenderCloseButton ? (
          <Flex>
            <TouchableOpacity onPress={onClose || handleBack}>
              <CloseMedium size={24} />
            </TouchableOpacity>
          </Flex>
        ) : (
          <Flex />
        )}
      </Flex>
      {children}
    </SafeAreaView>
  );
};

export default DeviceSetupView;
