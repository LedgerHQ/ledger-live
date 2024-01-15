import React, { useCallback, useState } from "react";
import Button, { WrappedButtonProps } from "./wrappedUi/Button";
import { GestureResponderEvent } from "react-native-modal";

type CtaProps = Pick<
  WrappedButtonProps,
  "onPress" | "children" | "pending" | "displayContentWhenPending"
>;
type OnePressCtaProps = CtaProps & {
  PressableComponent?: React.FC<CtaProps>;
};

const DefaultPressableComponent: React.FC<CtaProps> = props => (
  <Button type="main" size="large" displayContentWhenPending {...props} />
);

/**
 * OnePressCta is used as a simple Pressable component that blocks its UI by setting pending to true once it gets pressed
 *
 * @param onPress
 * @param PressableComponent
 * @param children
 */
export const OnePressCta: React.FunctionComponent<OnePressCtaProps> = ({
  onPress: onPressProp,
  PressableComponent = DefaultPressableComponent,
  children,
}) => {
  const [pending, setPending] = useState(false);
  const onPress = useCallback(
    (event: GestureResponderEvent) => {
      if (onPressProp) {
        onPressProp(event);
      }
      setPending(true);
    },
    [onPressProp],
  );

  return (
    <PressableComponent onPress={onPress} pending={pending}>
      {children}
    </PressableComponent>
  );
};
