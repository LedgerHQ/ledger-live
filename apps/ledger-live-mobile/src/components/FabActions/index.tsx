import React, { ComponentType, ReactElement, ReactNode, useCallback, useState } from "react";
import { AccountLike, Account } from "@ledgerhq/types-live";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Box } from "@ledgerhq/native-ui";
import { ParamListBase, useNavigation } from "@react-navigation/native";
import { Linking, TouchableOpacityProps } from "react-native";
import { ButtonProps } from "@ledgerhq/native-ui/components/cta/Button/index";
import { IconType } from "@ledgerhq/native-ui/components/Icon/type";
import { StackNavigationProp } from "@react-navigation/stack";
import InfoModal from "../InfoModal";
import { useAnalytics } from "~/analytics";
import { WrappedButtonProps } from "../wrappedUi/Button";
import { NavigatorName } from "~/const";

export type ModalOnDisabledClickComponentProps = {
  account?: AccountLike;
  parentAccount?: Account;
  currency?: CryptoCurrency | TokenCurrency;
  isOpen?: boolean;
  onClose: () => void;
  action: {
    label: ReactNode;
  };
};

export type NavigationParamsType = readonly [name: string, options: object];

export type ActionButtonEventProps = {
  navigationParams?: NavigationParamsType;
  linkUrl?: string;
  confirmModalProps?: {
    withCancel?: boolean;
    id?: string;
    title?: string | ReactElement;
    desc?: string | ReactElement;
    Icon?: ComponentType;
    children?: ReactNode;
    confirmLabel?: string | ReactElement;
    confirmProps?: WrappedButtonProps;
  };
  modalOnDisabledClick?: {
    component: React.ComponentType<ModalOnDisabledClickComponentProps>;
  };
  Component?: ComponentType;
  enableActions?: string;
};

export type ActionButtonEvent = ActionButtonEventProps & {
  label: React.ReactNode;
  // An id to be used for tracking the action button click
  id?: string;
  // Description : Seems unused
  description?: React.ReactNode;
  Icon: IconType;
  event?: string;
  eventProperties?: { [key: string]: unknown };
  Component?: ComponentType;
  buttonProps?: ButtonProps;
  disabled?: boolean;
  testId?: string;
};

export type ActionButtonProps = {
  Icon: IconType;
  disabled?: boolean;
  onPressWhenDisabled?: TouchableOpacityProps["onPress"];
  onPress?: TouchableOpacityProps["onPress"];
  children: React.ReactNode;
  buttonProps?: ButtonProps;
  testId?: string;
};

export const FabButtonBarProvider = ({
  actions,
  navigationProps,
  modalOnDisabledClickProps,
  eventProperties: globalEventProperties,
  children,
}: {
  actions: ActionButtonEvent[];
  navigationProps?: Record<string, unknown>;
  modalOnDisabledClickProps?: Partial<ModalOnDisabledClickComponentProps>;
  eventProperties?: { [key: string]: unknown };
  children: (value: { quickActions: ActionButtonProps[] }) => ReactNode;
}) => {
  const { track } = useAnalytics();
  const [pressedDisabledAction, setPressedDisabledAction] = useState<ActionButtonEvent | undefined>(
    undefined,
  );
  const [isDisabledActionModalOpened, setIsDisabledActionModalOpened] = useState(false);
  const [infoModalProps, setInfoModalProps] = useState<ActionButtonEventProps | undefined>(
    undefined,
  );
  const [isModalInfoOpened, setIsModalInfoOpened] = useState<boolean>();

  const navigation = useNavigation<StackNavigationProp<ParamListBase, string, NavigatorName>>();

  const onNavigate = useCallback(
    (name: string, options?: object) => {
      const parent = navigation.getParent(NavigatorName.RootNavigator);
      if (options && "drawer" in options) {
        return parent
          ? parent.setParams({ drawer: options.drawer })
          : navigation.navigate(NavigatorName.Base, options);
      }
      (
        navigation as StackNavigationProp<{
          [key: string]: object | undefined;
        }>
      ).navigate(name, {
        ...options,
        params: {
          ...(options ? (options as { params: object }).params : {}),
          ...navigationProps,
        },
      });
    },
    [navigation, navigationProps],
  );

  const onPress = useCallback(
    (data: Omit<ActionButtonEvent, "label" | "Icon">) => {
      const { navigationParams, confirmModalProps, linkUrl, event, eventProperties, id } = data;

      if (!confirmModalProps) {
        if (event) {
          track(event, { ...globalEventProperties, ...eventProperties });
        }
        if (id) {
          track("button_clicked", { ...globalEventProperties, button: id });
        }
        setInfoModalProps(undefined);
        if (linkUrl) {
          Linking.openURL(linkUrl);
        } else if (navigationParams) {
          onNavigate(...navigationParams);
        }
      } else {
        setInfoModalProps(data);
        setIsModalInfoOpened(true);
      }
    },
    [globalEventProperties, onNavigate, track],
  );

  const onContinue = useCallback(() => {
    setIsModalInfoOpened(false);
    onPress({ ...infoModalProps, confirmModalProps: undefined });
  }, [infoModalProps, onPress]);

  const onClose = useCallback(() => {
    setIsModalInfoOpened(false);
  }, []);

  const onPressWhenDisabled = useCallback((action: ActionButtonEvent) => {
    setPressedDisabledAction(action);
    setIsDisabledActionModalOpened(true);
  }, []);

  const quickActions: ActionButtonProps[] = actions
    .map(action => ({
      Icon: action.Icon,
      children: action.label,
      onPress: () => onPress(action),
      disabled: action.disabled,
      onPressWhenDisabled: action.modalOnDisabledClick
        ? () => onPressWhenDisabled(action)
        : undefined,
      buttonProps: action.buttonProps,
      testId: action.testId,
    }))
    .sort(a => (a.disabled ? 0 : -1));

  return (
    <Box>
      {pressedDisabledAction?.modalOnDisabledClick?.component && (
        <pressedDisabledAction.modalOnDisabledClick.component
          action={pressedDisabledAction}
          isOpen={isDisabledActionModalOpened}
          onClose={() => setIsDisabledActionModalOpened(false)}
          {...modalOnDisabledClickProps}
        />
      )}
      {isModalInfoOpened && infoModalProps && (
        <InfoModal
          {...(infoModalProps.confirmModalProps ? infoModalProps.confirmModalProps : {})}
          onContinue={onContinue}
          onClose={onClose}
          isOpened={isModalInfoOpened}
        />
      )}
      {children({ quickActions })}
    </Box>
  );
};
