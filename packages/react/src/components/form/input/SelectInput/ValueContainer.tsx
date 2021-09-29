import React from "react";
import { components, Styles, ValueContainerProps } from "react-select";
import Text from "@components/asorted/Text";

export const getStyles: Styles<any, any>["valueContainer"] = function getStyles(provided) {
  return {
    ...provided,
    padding: 0,
  };
};

type ExtraProps = {
  /* A render function to customize the contents. */
  render?: (props: React.PropsWithChildren<ValueContainerProps<any, any>>) => React.ReactNode;
};
export function ValueContainer(props: ValueContainerProps<any, any> & ExtraProps) {
  const color = props.selectProps.isDisabled ? "palette.neutral.c60" : "palette.neutral.c100";
  return (
    <components.ValueContainer {...props}>
      <Text as="div" type="paragraph" color={color}>
        {props.render ? props.render(props) : props.children}
      </Text>
    </components.ValueContainer>
  );
}
