import React, { useState } from "react";
import styled from "styled-components";
import Text from "../../components/asorted/Text";
import Flex from "../../components/layout/Flex";
import { palettes, ColorPalette } from "@ledgerhq/ui-shared";

export default { title: "Particles" };

const ColorArea = styled.div<{ type: keyof ColorPalette; shade: string }>`
  width: 200px;
  aspect-ratio: 1;
  background-color: ${p => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore next-line
    return p.theme.colors[p.type][p.shade];
  }};
  cursor: pointer;
  border-radius: 2px;
`;

type CardColorProps = { shade: string; type: string; value: string };
const CardColor = ({ shade, type, value }: CardColorProps): JSX.Element => {
  const [isHovered, setIsHovered] = useState(false);

  const onClick = (type: string, shade: string): void => {
    navigator.clipboard.writeText(`p.theme.colors.${type}.${shade}`);
  };

  return (
    <Flex
      flexDirection="column"
      alignItems="center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <ColorArea
        type={type as keyof ColorPalette}
        shade={shade}
        onClick={() => onClick(type, shade)}
      />
      <Text variant="tiny">{isHovered ? value : shade}</Text>
    </Flex>
  );
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { type: _, ...palette } = palettes.light;

export const Colors = (): JSX.Element => (
  <Flex flexDirection="column" rowGap="2rem">
    {Object.entries(palette).map(([type, shades]) => (
      <Flex flexDirection="column" rowGap="1rem">
        <Text variant="h2" textTransform="uppercase">
          {type}
        </Text>
        <Flex columnGap="0.5rem" rowGap="0.5rem" flexWrap="wrap">
          {Object.entries(shades).map(([shade, value]) => (
            <CardColor key={shade} shade={shade} type={type} value={value} />
          ))}
        </Flex>
      </Flex>
    ))}
  </Flex>
);
