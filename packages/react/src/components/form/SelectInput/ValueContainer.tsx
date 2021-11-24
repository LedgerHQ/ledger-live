import React from "react";
import { components, Styles, ValueContainerProps, OptionTypeBase } from "react-select";
import Text from "../../asorted/Text";

export function getStyles<
  T extends OptionTypeBase = { label: string; value: string },
  M extends boolean = false,
>(): Styles<T, M>["valueContainer"] {
  return (provided) => ({
    ...provided,
    padding: 0,
  });
}

type ExtraProps<
  T extends OptionTypeBase = { label: string; value: string },
  M extends boolean = false,
> = {
  /* A render function to customize the contents. */
  render?: (props: React.PropsWithChildren<ValueContainerProps<T, M>>) => React.ReactNode;
};
export function ValueContainer<
  T extends OptionTypeBase = { label: string; value: string },
  M extends boolean = false,
>(props: ValueContainerProps<T, M> & ExtraProps<T, M>): JSX.Element {
  const color = props.selectProps.isDisabled ? "neutral.c60" : "neutral.c100";
  return (
    <components.ValueContainer {...props}>
      <Text as="div" variant="paragraph" color={color}>
        {props.render ? props.render(props) : props.children}
      </Text>
    </components.ValueContainer>
  );
}
