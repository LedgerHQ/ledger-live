import React from "react";
import { GestureResponderEvent, TouchableOpacity } from "react-native";
import styled from "styled-components/native";
import Flex from "../Layout/Flex";
import { Text } from "../index";

export type ElementProps<V> = React.PropsWithChildren<{
  first?: boolean;
  selected?: boolean;
  disabled?: boolean;
  value?: V;
  onPress?: ((event: GestureResponderEvent) => void) | undefined;
  Icon?: (props: { size?: number; color?: string }) => React.ReactElement;
}>;

const ElementContainer = styled(Flex).attrs({
  accessible: true,
  accessibilityRole: "radio",
})``;

function Element<V>({
  first,
  value,
  selected,
  disabled,
  onPress,
  children,
  Icon,
}: ElementProps<V>) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled}>
      <ElementContainer
        p={6}
        mt={first ? 0 : 4}
        backgroundColor={selected ? "primary.c20" : "neutral.c00"}
        border="1px solid"
        borderColor={selected ? "primary.c100" : "neutral.c40"}
        borderRadius={1}
        flexDirection={"row"}
        alignItems={"center"}
      >
        {Icon && (
          <Flex mr={6}>
            <Icon size={24} color={disabled ? "neutral.c50" : "neutral.c100"} />
          </Flex>
        )}
        <Text variant="large" color={disabled ? "neutral.c50" : "neutral.c100"}>
          {children || value}
        </Text>
      </ElementContainer>
    </TouchableOpacity>
  );
}

export type Props<V> = React.PropsWithChildren<{
  currentValue?: V;
  onChange: (newValue: V) => void;
}>;

function SelectableList<V>({ currentValue, onChange, children }: Props<V>) {
  return (
    <Flex accessible accessibilityRole="radiogroup">
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const casted = child as React.ReactElement<ElementProps<any>>;
        return React.cloneElement(casted, {
          first: index === 0,
          onPress: () => onChange(casted?.props.value),
          selected: casted?.props.value === currentValue,
        });
      })}
    </Flex>
  );
}
SelectableList.Element = Element;
export default SelectableList;
