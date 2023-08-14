import React from "react";
import styled from "styled-components/native";
import Text from "../../../src/components/Text";
import Flex from "../../../src/components/Layout/Flex";
import ScrollContainer from "../../../src/components/Layout/ScrollContainer";
import { palettes, ColorPalette } from "@ledgerhq/ui-shared";

export default {
  title: "Particles/Colors",
  component: Flex,
};

const ColorArea = styled(Flex)<{ type: keyof ColorPalette; shade: string }>`
  width: 200px;
  aspect-ratio: 1;
  background-color: ${(p) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore next-line
    return p.theme.colors[p.type][p.shade];
  }};
  border-radius: 2px;
`;

type CardColorProps = { shade: string; type: string };
const CardColor = ({ shade, type }: CardColorProps): JSX.Element => {
  return (
    <Flex m={3} flexDirection="column" alignItems="center">
      <ColorArea type={type as keyof ColorPalette} shade={shade} />
      <Text variant="tiny">{shade}</Text>
    </Flex>
  );
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { type: _, ...palette } = palettes.dark;

export const Colors = (): JSX.Element => (
  <ScrollContainer width="100%">
    {Object.entries(palette).map(([type, shades], i) => (
      <Flex my={8} key={type + i} flexDirection="column" rowGap="1rem">
        <Text m={3} variant="h2" textTransform="uppercase">
          {type}
        </Text>
        <Flex flexDirection="row" flexWrap="wrap">
          {Object.entries(shades).map(([shade], j) => (
            <CardColor key={shade + i + j} shade={shade} type={type} />
          ))}
        </Flex>
      </Flex>
    ))}
  </ScrollContainer>
);

Colors.storyName = "Colors";
