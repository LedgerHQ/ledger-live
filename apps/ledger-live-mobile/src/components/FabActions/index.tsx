import React, {
  ComponentType,
  ReactElement,
  ReactNode,
  useCallback,
  useState,
} from "react";
import { AccountLike, Account } from "@ledgerhq/types-live";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Box } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";
import { Linking, TouchableOpacityProps } from "react-native";
import { ButtonProps } from "@ledgerhq/native-ui/components/cta/Button";
import { IconType } from "@ledgerhq/native-ui/components/Icon/type";
import InfoModal from "../InfoModal";
import { track } from "../../analytics";

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

export type ActionButtonEventProps = {
  navigationParams?: any[];
  linkUrl?: string;
  confirmModalProps?: {
    withCancel?: boolean;
    id?: string;
    title?: string | ReactElement;
    desc?: string | ReactElement;
    Icon?: ComponentType;
    children?: ReactNode;
    confirmLabel?: string | ReactElement;
    confirmProps?: any;
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
  eventProperties?: { [key: string]: any };
  Component?: ComponentType;
  buttonProps?: ButtonProps;
  disabled?: boolean;
};

export type ActionButtonProps = {
  Icon: IconType;
  disabled?: boolean;
  onPressWhenDisabled?: TouchableOpacityProps["onPress"];
  onPress?: TouchableOpacityProps["onPress"];
  children: React.ReactNode;
  buttonProps?: ButtonProps;
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
  eventProperties?: { [key: string]: any };
  children: (value: { quickActions: ActionButtonProps[] }) => ReactNode;
}) => {
  const [pressedDisabledAction, setPressedDisabledAction] = useState<
    ActionButtonEvent | undefined
  >(undefined);
  const [isDisabledActionModalOpened, setIsDisabledActionModalOpened] =
    useState(false);
  const [infoModalProps, setInfoModalProps] = useState<
    ActionButtonEventProps | undefined
  >(undefined);
  const [isModalInfoOpened, setIsModalInfoOpened] = useState<boolean>();

  const navigation = useNavigation();

  const onNavigate = useCallback(
    (name: string, options?: any) => {
      navigation.navigate(name, {
        ...options,
        params: {
          ...(options ? options.params : {}),
          ...navigationProps,
        },
      });
    },
    [navigation, navigationProps],
  );

  const onPress = useCallback(
    (data: ActionButtonEvent) => {
      const {
        navigationParams,
        confirmModalProps,
        linkUrl,
        event,
        eventProperties,
        id,
      } = data;

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
    [globalEventProperties, onNavigate],
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
          {...(infoModalProps.confirmModalProps
            ? infoModalProps.confirmModalProps
            : {})}
          onContinue={onContinue}
          onClose={onClose}
          isOpened={isModalInfoOpened}
        />
      )}
      {children({ quickActions })}
    </Box>
  );
};
