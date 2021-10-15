import React from "react";
import { TouchableOpacity } from "react-native";
import Button from "../../cta/Button";

type ToggleProps = {
  active?: boolean;
  onPress: () => void;
  children: React.ReactNode;
};

export default function Toggle({
  active = false,
  children,
  onPress,
}: ToggleProps): JSX.Element {
  return (
    <TouchableOpacity onPress={onPress}>
      <Button disabled={!active} type="main">
        {children}
      </Button>
    </TouchableOpacity>
  );
}
