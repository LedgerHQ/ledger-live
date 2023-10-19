import React, { useCallback, useState } from "react";
import Button, { WrappedButtonProps } from "../../components/wrappedUi/Button";
import { GestureResponderEvent } from "react-native-modal";

type EarlySecurityCheckEndedCtaProps = Pick<WrappedButtonProps, "onPress" | "children">;

/**
 * EarlySecurityCheckEndedCta is used in the end of ESC as a simple Button that blocks its UI by setting pending to true
 * At this step of the genuine check we're sure that the device will treat the command as without infinite loading
 *
 * @param onPress
 * @param children
 */
export const EarlySecurityCheckEndedCta: React.FunctionComponent<
  EarlySecurityCheckEndedCtaProps
> = ({ onPress: onPressProp, children }) => {
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
    <Button type="main" size="large" onPress={onPress} pending={pending} displayContentWhenPending>
      {children}
    </Button>
  );
};
