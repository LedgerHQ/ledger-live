import React from "react";
import { components, GroupBase, StylesConfig, ValueContainerProps } from "react-select";
import Text from "../../asorted/Text";

export function getStyles<
  O = unknown,
  M extends boolean = false,
  G extends GroupBase<O> = GroupBase<O>,
>(): StylesConfig<O, M, G>["valueContainer"] {
  return (provided) => ({
    ...provided,
    padding: 0,
  });
}

type ExtraProps<O = unknown, M extends boolean = false, G extends GroupBase<O> = GroupBase<O>> = {
  /* A render function to customize the contents. */
  render?: (props: React.PropsWithChildren<ValueContainerProps<O, M, G>>) => React.ReactNode;
};
export function ValueContainer<
  O = unknown,
  M extends boolean = false,
  G extends GroupBase<O> = GroupBase<O>,
>(props: ValueContainerProps<O, M, G> & ExtraProps<O, M, G>): JSX.Element {
  const color = props.selectProps.isDisabled ? "neutral.c60" : "neutral.c100";
  return (
    <components.ValueContainer {...props}>
      <Text
        as="div"
        variant="paragraph"
        color={color}
        style={{ display: "inherit", alignItems: "center" }}
      >
        {props.render ? props.render(props) : props.children}
      </Text>
    </components.ValueContainer>
  );
}
