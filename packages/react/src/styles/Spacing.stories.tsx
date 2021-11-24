import React from "react";
import styled, { useTheme } from "styled-components";

import Flex from "../components/layout/Flex";
import Text from "../components/asorted/Text";

export default {
  title: "Particles",
};

const SpaceRow = styled(Flex).attrs({
  columnGap: "40px",
  alignItems: "center",
})`
  padding: 4px;
  box-sizing: border-box;
  border: 1px solid;
  border-color: transparent;
  cursor: pointer;

  &:hover {
    border-color: ${(props) => props.theme.colors.neutral.c40};
  }
`;

export const Spacing = (): JSX.Element => {
  const theme = useTheme();
  const [, ...space] = theme.space;

  const handleClick = (index: number): void => {
    navigator.clipboard.writeText(`space[${index + 1}]`);
  };

  return (
    <Flex flexDirection="column" rowGap="24px">
      {space.map((value, index) => (
        <SpaceRow key={value} onClick={() => handleClick(index)}>
          <Text variant="small" style={{ minWidth: "5ch" }}>
            {`${value}px`}
            <br />
            <Text variant="small" color="neutral.c70">
              space[{index + 1}]
            </Text>
          </Text>
          <Flex
            flexGrow={1}
            style={{
              height: value,
              backgroundColor: theme.colors.primary.c20,
            }}
          />
        </SpaceRow>
      ))}
    </Flex>
  );
};
