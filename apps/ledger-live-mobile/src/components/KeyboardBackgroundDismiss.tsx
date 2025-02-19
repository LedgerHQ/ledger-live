import React from "react";
import {
  Keyboard,
  TouchableWithoutFeedback,
  View,
  StyleProp,
  ViewStyle,
  Platform,
} from "react-native";

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  enabled?: boolean;
};

const SafeKeyboardView: React.FC<Props> = ({ children, style, enabled = true }) => {
  if (!enabled) {
    return <View style={style}>{children}</View>;
  }

  const onPress = () => {
    if (Platform.OS === "ios") {
      Keyboard.scheduleLayoutAnimation({
        easing: "linear",
        duration: 300,
        endCoordinates: { screenX: 0, screenY: 0, width: 0, height: 0 },
      });
    }
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={onPress} accessible={false}>
      <View style={[style, { flex: 1 }]}>{children}</View>
    </TouchableWithoutFeedback>
  );
};

export default SafeKeyboardView;
