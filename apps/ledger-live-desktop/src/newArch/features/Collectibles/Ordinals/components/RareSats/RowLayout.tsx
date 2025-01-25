import React from "react";
import { Flex } from "@ledgerhq/react-ui";
import styled from "styled-components";

type Props = {
  firstColumnElement: JSX.Element;
  secondColumnElement: JSX.Element;
  bgColor?: string;
  isMultipleRow?: boolean;
};

const Container = styled(Flex)`
  &:first-child {
    border-top: 1px solid ${p => p.theme.colors.palette.text.shade10};
    padding-top: 15px;
  }
  &:last-child {
    padding-bottom: 15px;
  }
`;

const RowLayout: React.FC<Props> = ({
  firstColumnElement,
  secondColumnElement,
  bgColor,
  isMultipleRow,
}) => {
  const verticalPadding = isMultipleRow ? 1 : 3;
  return (
    <Container
      py={verticalPadding}
      px={4}
      flexDirection="row"
      maxHeight={64}
      alignItems="center"
      bg={bgColor}
    >
      <Flex flex={1}>{firstColumnElement}</Flex>
      <Flex flex={1} flexDirection="row" columnGap={20}>
        <Flex flex={1} justifyContent="flex-end">
          {secondColumnElement}
        </Flex>
      </Flex>
    </Container>
  );
};

export default RowLayout;
