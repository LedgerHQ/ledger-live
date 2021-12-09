import React from "react";
import { components, GroupBase, IndicatorsContainerProps } from "react-select";
import FlexBox from "../../layout/Flex";
import { Props as SelectProps } from "./index";

export function IndicatorsContainer<
  O = unknown,
  M extends boolean = false,
  G extends GroupBase<O> = GroupBase<O>,
>(props: IndicatorsContainerProps<O, M, G>): JSX.Element {
  const { renderRight } = props.selectProps as SelectProps<O, M, G>;

  return (
    <FlexBox alignItems="center">
      {renderRight ? renderRight(props) : null}
      <components.IndicatorsContainer {...props} />
    </FlexBox>
  );
}
