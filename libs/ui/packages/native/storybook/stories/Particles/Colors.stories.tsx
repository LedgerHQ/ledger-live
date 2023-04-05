import React, { useMemo } from "react";
import styled, { useTheme } from "styled-components/native";
import Text from "../../../src/components/Text";
import Flex from "../../../src/components/Layout/Flex";
import ScrollContainer from "../../../src/components/Layout/ScrollContainer";
import { storiesOf } from "../storiesOf";
import { ColorPalette } from "@ledgerhq/ui-shared";
import { getAlpha, hex } from "../../../src/styles/helpers";

export default { title: "Particles" };

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

type CardColorProps = { shade: string; type: string; value: string };
const CardColor = ({ shade, type, value }: CardColorProps): JSX.Element => {
  const rgba = useMemo(
    () => (value.length > 7 ? `${hex(value)} ${getAlpha(value) * 100}%` : value),
    [value],
  );

  return (
    <Flex m={3} flexDirection="column" alignItems="center">
      <ColorArea type={type as keyof ColorPalette} shade={shade} />
      <Text variant="tiny">{shade}</Text>
      <Text variant="tiny" color="neutral.c60">
        {rgba}
      </Text>
    </Flex>
  );
};

export const Colors = (): JSX.Element => {
  const { colors } = useTheme();
  const { palette, type, ...others } = colors; // eslint-disable-line @typescript-eslint/no-unused-vars
  return (
    <ScrollContainer width="100%">
      {Object.entries(others).map(([type, shades], i) => (
        <Flex my={8} key={type + i} flexDirection="column" rowGap="1rem">
          <Text m={3} variant="h2" textTransform="uppercase">
            {type}
          </Text>
          <Flex flexDirection="row" flexWrap="wrap">
            {Object.entries(shades).map(([shade, value], j) => (
              <CardColor key={shade + i + j} shade={shade} type={type} value={value} />
            ))}
          </Flex>
        </Flex>
      ))}
    </ScrollContainer>
  );
};

storiesOf((story) => story("Particles", module).add("Colors", Colors));
