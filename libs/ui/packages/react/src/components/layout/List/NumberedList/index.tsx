import React from "react";
import styled, { useTheme } from "styled-components";
import Flex from "../../Flex";
import Text from "../../../asorted/Text";
import { rgba } from "../../../../styles/helpers";

export type Item = {
  element: React.ReactNode | string;
};

export type Props = {
  steps: Item[];
  bgIndexColor?: string;
  indexColor?: string;
  textColor?: string;
};

export default function NumberedList({ steps, bgIndexColor, indexColor, textColor }: Props) {
  const { colors } = useTheme();
  const backgroundIndexColor = bgIndexColor ?? colors.primary.c80;
  const indexTextColor = indexColor ?? colors.neutral.c00;
  const mainTextColor = textColor ?? rgba(colors.neutral.c100, 0.7);
  return (
    <Flex flexDirection="column" rowGap={"14px"}>
      {steps?.map((step, index) => (
        <Flex key={index} flexDirection="row" alignItems="center">
          {NumberItem(index + 1, backgroundIndexColor, indexTextColor)}

          {typeof step.element === "string" ? (
            <Text
              key={index}
              fontSize={14}
              variant="body"
              color={mainTextColor}
              ml="12px"
              fontWeight="500"
              flex={1}
            >
              {step.element}
            </Text>
          ) : (
            step.element
          )}
        </Flex>
      ))}
    </Flex>
  );
}

const NumberItem = (index: number, bgColor: string, color: string) => {
  return (
    <StyledNumberItem bgColor={bgColor}>
      <Text color={color} fontWeight="900" fontSize={"11px"}>
        {index}
      </Text>
    </StyledNumberItem>
  );
};

const StyledNumberItem = styled(Flex)<{ bgColor: string }>`
  border-radius: 50%;
  background-color: ${p => p.bgColor};
  align-items: center;
  justify-content: center;
  height: 16px;
  width: 16px;
`;
