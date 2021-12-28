import React from "react";
import { TouchableOpacity } from "react-native";
import Button from "../../cta/Button";
import type { ButtonProps } from "../../cta/Button";

type ToggleProps = {
  active?: boolean;
  onPress: () => void;
  children: ButtonProps["children"];
};

export default function Toggle({ active = false, children, onPress }: ToggleProps): JSX.Element {
  return (
    <TouchableOpacity onPress={onPress}>
      <Button disabled={!active} type="main">
        {children}
      </Button>
    </TouchableOpacity>
  );
}
