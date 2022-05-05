import React, {
  useCallback,
  memo,
  useState,
  ComponentType,
  ReactElement,
  ReactNode,
} from "react";
import { useNavigation } from "@react-navigation/native";
import { Linking } from "react-native";

import { AccountLike, Account } from "@ledgerhq/live-common/lib/types";

import { ScrollContainer } from "@ledgerhq/native-ui";
import ChoiceButton from "./ChoiceButton";
import InfoModal from "./InfoModal";
import Button from "./wrappedUi/Button";

type ActionButtonEventProps = {
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
  Component?: ComponentType;
  enableActions?: string;
};

export type ActionButton = ActionButtonEventProps & {
  label: ReactNode;
  Icon?: ComponentType<{ size: number; color: string }>;
  event: string;
  eventProperties?: { [key: string]: any };
  Component?: ComponentType;
  type?: string;
  outline?: boolean;
  disabled?: boolean;
};

type Props = {
  buttons: ActionButton[];
  actions?: { default: ActionButton[]; lending?: ActionButton[] };
  account?: AccountLike;
  parentAccount?: Account;
};

function FabAccountButtonBar({
  buttons,
  actions,
  account,
  parentAccount,
  ...props
}: Props) {
  const navigation = useNavigation();

  const [infoModalProps, setInfoModalProps] = useState<
    ActionButtonEventProps | undefined
  >();
  const [isModalInfoOpened, setIsModalInfoOpened] = useState();

  const onNavigate = useCallback(
    (name: string, options?: any) => {
      const accountId = account ? account.id : undefined;
      const parentId = parentAccount ? parentAccount.id : undefined;
      navigation.navigate(name, {
        ...options,
        params: {
          ...(options ? options.params : {}),
          accountId,
          parentId,
        },
      });
    },
    [account, parentAccount, navigation],
  );

  const onPress = useCallback(
    (data: ActionButtonEventProps) => {
      const { navigationParams, confirmModalProps, linkUrl } = data;
      if (!confirmModalProps) {
        setInfoModalProps();
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
    [onNavigate, setIsModalInfoOpened],
  );

  const onContinue = useCallback(() => {
    setIsModalInfoOpened(false);
    onPress({ ...infoModalProps, confirmModalProps: undefined });
  }, [infoModalProps, onPress]);

  const onClose = useCallback(() => {
    setIsModalInfoOpened();
  }, []);

  const onChoiceSelect = useCallback(({ navigationParams, linkUrl }) => {
    if (linkUrl) {
      Linking.openURL(linkUrl);
    } else if (navigationParams) {
      onNavigate(...navigationParams);
    }
  }, []);

  return (
    <ScrollContainer
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16 }}
      {...props}
    >
      {buttons.map(
        (
          {
            label,
            Icon,
            event,
            eventProperties,
            Component,
            type = "color",
            outline = false,
            disabled,
            ...rest
          },
          index,
        ) => (
          <Button
            size={"small"}
            Icon={Icon}
            iconPosition={"left"}
            event={event}
            eventProperties={eventProperties}
            type={type}
            outline={outline}
            disabled={disabled}
            onPress={() => onPress(rest)}
            key={index}
            mr={3}
          >
            {label}
          </Button>
        ),
      )}
      {actions?.default?.map((a, i) =>
        a.Component ? (
          <a.Component key={i} />
        ) : (
          <ChoiceButton {...a} key={i} onSelect={onChoiceSelect} />
        ),
      )}
      {isModalInfoOpened && infoModalProps && (
        <InfoModal
          {...(infoModalProps.confirmModalProps
            ? infoModalProps.confirmModalProps
            : {})}
          onContinue={onContinue}
          onClose={onClose}
          isOpened={!!isModalInfoOpened}
        />
      )}
    </ScrollContainer>
  );
}

export default memo<Props>(FabAccountButtonBar);
