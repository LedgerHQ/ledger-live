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

/**
 * Represents a simple wrapping view used for components and screens associated to device setup
 *
 * If `hasBackButton` or `onBack` is provided, a back button will be rendered
 * If `renderLeft` is provided, it will be rendered instead of the back button
 *
 * If `hasCloseButton` or `onClose` is provided, a close button will be rendered
 * If `renderRight` is provided, it will be rendered instead of the close button
 */
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

  const canRenderBackButton = hasBackButton || onBack;
  const canRenderCloseButton = hasCloseButton || onClose;

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.main }}>
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
