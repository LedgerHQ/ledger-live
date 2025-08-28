import { Button, Flex, Icons, IconsLegacy } from "@ledgerhq/native-ui";
import { ParamListBase, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useState } from "react";
import ConfirmationModal from "./ConfirmationModal";
import type { Props as BottomModalProps } from "./QueuedDrawer";
import { BaseNavigatorStackParamList } from "./RootNavigator/types/BaseNavigator";
import { StackNavigatorNavigation } from "./RootNavigator/types/helpers";
import Touchable from "./Touchable";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { useNavigateToPostOnboardingHubCallback } from "~/logic/postOnboarding/useNavigateToPostOnboardingHubCallback";
import { StyleProp, ViewStyle } from "react-native";

type Props = {
  /**
   * Function called when user presses on the close button.
   * If undefined: default `navigation.popToTop` is used.
   */
  onPress?: () => void;
  /**
   * Color of the close icon
   */
  color?: string;
};

/**
 * Close button that should be used as the close button on the react-navigation header.
 *
 * For more advanced configuration (for ex: a confirmation modal) and legacy usage,
 * use `NavigationHeaderCloseButtonAdvanced` defined below.
 */
export const NavigationHeaderCloseButton: React.FC<Props> = React.memo(({ onPress, color }) => {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  return (
    <Touchable
      touchableTestID="NavigationHeaderCloseButton"
      event="HeaderRightClose"
      onPress={() => (onPress ? onPress() : navigation.popToTop())}
    >
      <Flex p={6}>
        <Icons.Close color={color || "neutral.c100"} />
      </Flex>
    </Touchable>
  );
});

export const NavigationHeaderCloseButtonRounded: React.FC<Props> = React.memo(({ onPress }) => {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  return (
    <Touchable
      onPress={() => (onPress ? onPress() : navigation.popToTop())}
      touchableTestID="NavigationHeaderCloseButton"
      event="HeaderRightClose"
    >
      <Flex
        bg="neutral.c100"
        width="32px"
        height="32px"
        alignItems="center"
        justifyContent="center"
        borderRadius={32}
        mr={6}
      >
        <IconsLegacy.CloseMedium size={20} color="neutral.c00" />
      </Flex>
    </Touchable>
  );
});

export type CtaConfig = {
  type: string;
  styles: StyleProp<ViewStyle>;
  outline: boolean;
};

type AdvancedProps = {
  preferDismiss?: boolean;
  skipNavigation?: boolean;
  color?: string;
  withConfirmation?: boolean;
  confirmationTitle?: React.ReactNode;
  confirmationDesc?: React.ReactNode;
  onClose?: () => void;
  rounded?: boolean;
  showButton?: boolean;
  buttonText?: string;
  customDrawerStyle?: Record<string, unknown>;
  cancelCTAConfig?: Partial<CtaConfig>;
  confirmCTAConfig?: Partial<CtaConfig>;
  confirmButtonText?: React.ReactNode;
  rejectButtonText?: React.ReactNode;
  isOnboardingFlow?: boolean;
  popToTop?: boolean;
};

/**
 * Close button that should be used as the close button on the right of the react-navigation header
 * when advanced configuration is needed.
 *
 * Enables a confirmation modal, and some legacy configuration.
 */
export const NavigationHeaderCloseButtonAdvanced: React.FC<AdvancedProps> = React.memo(
  ({
    color,
    preferDismiss = true,
    skipNavigation,
    withConfirmation,
    confirmationTitle,
    confirmationDesc,
    onClose,
    rounded = false,
    showButton = false,
    buttonText,
    customDrawerStyle,
    cancelCTAConfig,
    confirmCTAConfig,
    confirmButtonText,
    rejectButtonText,
    isOnboardingFlow = false,
    popToTop = false,
  }) => {
    const navigation = useNavigation();
    const [isConfirmationModalOpened, setIsConfirmationModalOpened] = useState(false);
    const [onModalHide, setOnModalHide] = useState<BottomModalProps["onModalHide"]>();
    const { postOnboardingInProgress } = usePostOnboardingHubState();
    const navigateToPostOnboardingHub = useNavigateToPostOnboardingHubCallback();

    const close = useCallback(() => {
      if (postOnboardingInProgress && !isOnboardingFlow) {
        navigateToPostOnboardingHub();
        return;
      }

      if (skipNavigation) {
        // onClose should always be called at the end of the close method,
        // so the callback will not interfere with the expected behavior of this component
        onClose?.();
        return;
      }

      const parent = navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>();
      if (parent && "pop" in parent && preferDismiss) {
        const parentNavigation = parent;

        if (popToTop && "popToTop" in parentNavigation) {
          parentNavigation.popToTop();
          onClose?.();
          return;
        } else if ("canGoBack" in parentNavigation && parentNavigation.canGoBack()) {
          parentNavigation.pop();
          onClose?.();
          return;
        }
      }
      if ("closeDrawer" in navigation && typeof navigation.closeDrawer === "function") {
        navigation.closeDrawer();
      }
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
      onClose?.();
    }, [
      navigateToPostOnboardingHub,
      navigation,
      onClose,
      postOnboardingInProgress,
      preferDismiss,
      skipNavigation,
      isOnboardingFlow,
      popToTop,
    ]);

    const openConfirmationModal = useCallback(() => {
      setIsConfirmationModalOpened(true);
    }, []);

    const onPress = useCallback(() => {
      if (withConfirmation) {
        openConfirmationModal();
      } else {
        close();
      }
    }, [close, openConfirmationModal, withConfirmation]);

    const closeConfirmationModal = useCallback(() => {
      setIsConfirmationModalOpened(false);
    }, []);

    const onConfirm = useCallback(() => {
      setOnModalHide(close);
      setIsConfirmationModalOpened(false);
    }, [close]);

    const renderCloseElement = useCallback(() => {
      if (showButton && buttonText)
        return (
          <Button size="large" testID="button-close-add-account" onPress={onPress}>
            {buttonText}
          </Button>
        );

      if (rounded) return <NavigationHeaderCloseButtonRounded onPress={onPress} color={color} />;
      else return <NavigationHeaderCloseButton onPress={onPress} color={color} />;
    }, [buttonText, showButton, onPress, rounded, color]);

    return (
      <>
        {renderCloseElement()}

        {withConfirmation && (
          <ConfirmationModal
            isOpened={isConfirmationModalOpened}
            onClose={closeConfirmationModal}
            onConfirm={onConfirm}
            confirmationTitle={confirmationTitle}
            confirmationDesc={confirmationDesc}
            onModalHide={onModalHide}
            customTitleStyle={customDrawerStyle?.title ?? {}}
            customDescriptionStyle={customDrawerStyle?.description ?? {}}
            confirmCTAConfig={confirmCTAConfig ?? {}}
            cancelCTAConfig={cancelCTAConfig ?? {}}
            confirmButtonText={confirmButtonText}
            rejectButtonText={rejectButtonText}
          />
        )}
      </>
    );
  },
);
