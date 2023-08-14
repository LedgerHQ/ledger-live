import React from "react";

import StepperItem from "./StepperItem";
import { Flex } from "../..";
import { BaseStyledProps } from "src/components/styled";
import { Item } from "../types";

export type Props = BaseStyledProps & {
  steps?: Item[];
  onTapIndex?: (arg0: number) => void;
  nested?: boolean;
};

export default React.memo(function VerticalStepper({ steps, onTapIndex, nested, ...props }: Props) {
  return (
    <Flex {...props} flexDirection="column">
      {nested && <Flex mt={7} mb={4} borderBottomWidth={1} borderBottomColor="neutral.c40" />}
      {steps?.map((step, index) => (
        <StepperItem
          key={step.title}
          item={step}
          progress={step.progress}
          nested={nested}
          isLastItem={index === steps.length - 1}
          onTapIndex={onTapIndex}
          index={index}
        />
      ))}
    </Flex>
  );
});
