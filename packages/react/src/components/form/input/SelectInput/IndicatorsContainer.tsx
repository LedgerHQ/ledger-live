import React from "react";
import { components, IndicatorContainerProps, OptionTypeBase } from "react-select";
import FlexBox from "@components/layout/Flex";

export function IndicatorsContainer<
  T extends OptionTypeBase = { label: string; value: string },
  M extends boolean = false,
>(props: IndicatorContainerProps<T, M>): JSX.Element {
  const {
    selectProps: { renderRight },
  } = props;

  return (
    <FlexBox alignItems="center">
      {renderRight ? renderRight(props) : null}
      <components.IndicatorsContainer {...props} />
    </FlexBox>
  );
}
