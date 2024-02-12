import React, { useCallback, memo, useContext, useMemo } from "react";
import { StyleProp, ViewStyle } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { Button } from "@ledgerhq/native-ui";
import type { ButtonProps } from "@ledgerhq/native-ui/components/cta/Button/index";
import ButtonUseTouchableContext from "~/context/ButtonUseTouchableContext";
import { track } from "~/analytics";

const inferType = (type?: string): ButtonProps["type"] => {
  switch (type) {
    case "primary":
    case "lightPrimary":
      return "shade";
    case "alert":
      return "error";
    case "negativePrimary":
    case "secondary":
    case "lightSecondary":
    case "darkSecondary":
    case "greySecondary":
    case "tertiary":
      return "main";
    default:
      return (type as ButtonProps["type"]) || "default";
  }
};

export interface BaseButtonProps extends Omit<ButtonProps, "type"> {
  title?: React.ReactNode | string;
  // when on press returns a promise,
  // the button will toggle in a pending state and
  // will wait the promise to complete before enabling the button again
  // it also displays a spinner if it takes more than WAIT_TIME_BEFORE_SPINNER
  onPress?: () => void;
  pending?: boolean;
  disabled?: boolean;
  IconLeft?: React.ComponentType<{ size?: number; color?: string }>;
  IconRight?: React.ComponentType<{ size?: number; color?: string }>;
  containerStyle?: StyleProp<ViewStyle>;
  type?: string;
  // for analytics
  event?: string;
  eventProperties?: Record<string, unknown>;
  // for testing
  testID?: string;
}

type Props = BaseButtonProps & {
  useTouchable: boolean;
  isFocused: boolean;
};

/**
 * @deprecated This button is a wrapper around native-ui, trying to translate the props of this component to those of the native-ui button. Please use directly Button from @ledgerhq/native-ui or the wrapped one from ./wrappedUi if you want to use event and eventProperties props.
 */
function ButtonWrapped(props: BaseButtonProps) {
  const isFocused = useIsFocused(); // @Warning be careful not to import the wrapped button outside of navigation context
  const useTouchable = useContext(ButtonUseTouchableContext);
  return <BaseButton {...props} useTouchable={useTouchable} isFocused={isFocused} />;
}

export function BaseButton({
  // required props
  title,
  onPress,
  Icon,
  IconLeft,
  IconRight,
  iconPosition,
  disabled,
  useTouchable,
  event,
  eventProperties,
  type,
  outline = true,
  containerStyle,
  children,
  ...otherProps
}: Props) {
  const onPressHandler = useCallback(async () => {
    if (!onPress) return;
    if (event) {
      track(event, eventProperties || null);
    }
    onPress();
  }, [event, eventProperties, onPress]);

  const isDisabled = disabled || !onPress;

  const containerSpecificProps = useTouchable ? {} : { enabled: !isDisabled };

  function getTestID() {
    if (isDisabled || !otherProps.isFocused) return undefined;
    if (otherProps.testID) return otherProps.testID;

    switch (type) {
      case "primary":
      case "main":
        return "Proceed";
      default:
        return event;
    }
  }
  const testID = useMemo(getTestID, [
    isDisabled,
    otherProps.isFocused,
    otherProps.testID,
    event,
    type,
  ]);

  const ButtonIcon = Icon ?? IconRight ?? IconLeft;
  const buttonIconPosition = iconPosition ?? (IconRight && "right") ?? (IconLeft && "left");

  return (
    <Button
      type={inferType(type)}
      onPress={isDisabled ? undefined : onPressHandler}
      Icon={ButtonIcon}
      iconPosition={buttonIconPosition}
      outline={outline}
      {...containerSpecificProps}
      {...otherProps}
      testID={testID}
      style={containerStyle}
      disabled={isDisabled}
    >
      {title || children || null}
    </Button>
  );
}

export default memo<BaseButtonProps>(ButtonWrapped);
