import { Flex, IconsLegacy } from "@ledgerhq/native-ui";
import { ParamListBase, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useCallback, useState } from "react";
import ConfirmationModal from "./ConfirmationModal";
import type { Props as BottomModalProps } from "./QueuedDrawer";
import { BaseNavigatorStackParamList } from "./RootNavigator/types/BaseNavigator";
import { StackNavigatorNavigation } from "./RootNavigator/types/helpers";
import Touchable from "./Touchable";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { useNavigateToPostOnboardingHubCallback } from "~/logic/postOnboarding/useNavigateToPostOnboardingHubCallback";

// eslint-disable-next-line @typescript-eslint/no-empty-function
const emptyFunction = () => {};

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
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
  return (
    <Touchable
      touchableTestID="NavigationHeaderCloseButton"
      event="HeaderRightClose"
      onPress={() => (onPress ? onPress() : navigation.popToTop())}
    >
      <Flex p={6}>
        <IconsLegacy.CloseMedium size={24} color={color || "neutral.c100"} />
      </Flex>
    </Touchable>
  );
});

export const NavigationHeaderCloseButtonRounded: React.FC<Props> = React.memo(({ onPress }) => {
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
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

type AdvancedProps = {
  preferDismiss?: boolean;
  skipNavigation?: boolean;
  color?: string;
  withConfirmation?: boolean;
  confirmationTitle?: React.ReactNode;
  confirmationDesc?: React.ReactNode;
  onClose?: () => void;
  rounded?: boolean;
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
    onClose = emptyFunction,
    rounded = false,
  }) => {
    const navigation = useNavigation();
    const [isConfirmationModalOpened, setIsConfirmationModalOpened] = useState(false);
    const [onModalHide, setOnModalHide] = useState<BottomModalProps["onModalHide"]>();
    const { postOnboardingInProgress } = usePostOnboardingHubState();
    const navigateToPostOnboardingHub = useNavigateToPostOnboardingHubCallback();

    const close = useCallback(() => {
      if (postOnboardingInProgress) {
        navigateToPostOnboardingHub();
        return;
      }

      if (skipNavigation) {
        // onClose should always be called at the end of the close method,
        // so the callback will not interfere with the expected behavior of this component
        onClose && onClose();
        return;
      }

      if ((navigation.getParent() as { pop?: unknown }).pop && preferDismiss) {
        navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();

        onClose && onClose();
        return;
      }

      if ((navigation as { closeDrawer?: unknown }).closeDrawer)
        (navigation as unknown as { closeDrawer: () => void }).closeDrawer();
      navigation.goBack();
      onClose();
    }, [
      navigateToPostOnboardingHub,
      navigation,
      onClose,
      postOnboardingInProgress,
      preferDismiss,
      skipNavigation,
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

    return (
      <>
        {rounded ? (
          <NavigationHeaderCloseButtonRounded onPress={onPress} color={color} />
        ) : (
          <NavigationHeaderCloseButton onPress={onPress} color={color} />
        )}

        {withConfirmation && (
          <ConfirmationModal
            isOpened={isConfirmationModalOpened}
            onClose={closeConfirmationModal}
            onConfirm={onConfirm}
            confirmationTitle={confirmationTitle}
            confirmationDesc={confirmationDesc}
            onModalHide={onModalHide}
          />
        )}
      </>
    );
  },
);
