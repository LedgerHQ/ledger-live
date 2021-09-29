import React from "react";
import { components, IndicatorContainerProps } from "react-select";
import FlexBox from "@components/layout/Flex";

export function IndicatorsContainer(props: IndicatorContainerProps<any, any>) {
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
