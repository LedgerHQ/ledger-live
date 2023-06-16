import React, { ComponentType } from "react";
import { GestureResponderEvent, TouchableOpacity } from "react-native";
import styled from "styled-components/native";
import Flex from "../Layout/Flex";
import { Text } from "../index";
import { IconType } from "../Icon/type";

type BaseElementProps<V> = {
  first?: boolean;
  selected?: boolean;
  disabled?: boolean;
  value?: V;
  onPress?: ((event: GestureResponderEvent) => void) | undefined;
  Icon?: IconType;
};

export type ElementProps<V> = React.PropsWithChildren<
  BaseElementProps<V> & {
    /**
     * A function that will render some content on the right side of the input.
     */
    renderRight?: ComponentType<BaseElementProps<V>> | React.ReactElement;
  }
>;

const ElementContainer = styled(Flex).attrs({
  accessible: true,
  accessibilityRole: "radio",
})``;

function Element<V>(props: ElementProps<V>) {
  const {
    first,
    value,
    selected,
    disabled,
    onPress,
    children,
    Icon,
    renderRight: RenderRight,
  } = props;
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled}>
      <ElementContainer
        p={6}
        mt={first ? 0 : 4}
        backgroundColor={selected ? "primary.c20" : "transparent"}
        border="1px solid"
        borderColor={selected ? "primary.c50" : "neutral.c40"}
        borderRadius={1}
        flexDirection={"row"}
        alignItems={"center"}
      >
        {Icon && (
          <Flex mr={6} flexShrink={0}>
            <Icon
              size={24}
              color={disabled ? "neutral.c50" : selected ? "primary.c90" : "neutral.c100"}
            />
          </Flex>
        )}
        <Text
          variant="large"
          flex={1}
          color={disabled ? "neutral.c50" : selected ? "primary.c90" : "neutral.c100"}
        >
          {children || value}
        </Text>
        {RenderRight && (
          <Flex pl={6} flexShrink={0}>
            {React.isValidElement(RenderRight) ? (
              RenderRight
            ) : (
              /* @ts-expect-error TS 5 can't seem to be able to prove this is a react comopnent here */
              <RenderRight {...props} />
            )}
          </Flex>
        )}
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
