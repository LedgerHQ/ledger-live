import React, { useState } from "react";
import styled from "styled-components";
import { Text, SearchInput, Flex, Grid, CryptoIcon } from "../../..";
import * as cryptoIcons from "@ledgerhq/crypto-icons-ui/react";

const description = `
### A customizable crypto-icon component.

### Props

\`\`\`tsx
type Props = {
  name: string;
  size?: number;
  color?: string;
  backgroundColor?: string; // overrides background color to ensure contrast with icon color
  circleIcon?: boolean; // if icon is in a circle or not
  tokenIcon?: string; // ref to the token icon to show as a sub icon
  disabled?: boolean;
  fallback?: JSX.Element; // fallback element if no icon found - defaults to an icon with first letter of icon name
};
\`\`\`
`;

type CryptoIconsProps = {
  name: keyof typeof cryptoIcons;
  size?: number;
  color?: string;
  circleIcon?: boolean;
  disabled?: boolean;
  tokenIcon?: string;
};

const ScrollArea = styled(Grid)`
  flex: 1;
  height: auto;
  ${(p) => p.theme.overflow.y};
`;

const Container = styled(Flex).attrs({
  flex: 1,
  flexDirection: "column",
  p: 4,
})`
  overflow: hidden;
  height: calc(100vh - 4em);
`;

const IconContainer = styled(Flex).attrs<{ active?: boolean }>({
  flexDirection: "column",
  justifyContent: "flex-end",
  alignItems: "center",
  p: 4,
})<{ active?: boolean }>`
  ${(p) => (p.active ? `background-color: ${p.theme.colors.neutral.c20};` : ``)}
  border-radius: 4px;
  height: 100px;
`;

const Bold = styled.b`
  color: ${(p) => p.theme.colors.primary.c80};
`;

const Story = {
  title: "Asorted/CryptoIcons",
  argTypes: {
    size: {
      type: "number",
      description: "Icon size for preview",
      defaultValue: 32,
    },
    color: {
      type: "string",
      description: "Color",
      control: { control: "color" },
    },
    name: {
      type: "enum",
      defaultValue: "BTC",
      description: "[Only for single icon], Icon name",
      control: {
        options: Object.keys(cryptoIcons),
        control: {
          type: "select",
        },
      },
    },
    circleIcon: {
      type: "boolean",
      description: "if icon is in a circle or not",
      defaultValue: false,
    },
    disabled: {
      type: "boolean",
      description: "if icon is in a disabled or not",
      defaultValue: false,
    },
    tokenIcon: {
      type: "string",
      description: "ref to the token icon to show as a sub icon",
      defaultValue: "",
    },
  },
  parameters: {
    docs: {
      description: {
        component: description,
      },
    },
  },
};
export default Story;

const ListTemplate = (args: CryptoIconsProps) => {
  const color = args.color || undefined;
  const [search, setSearch] = useState("");
  const s = search.toLowerCase();
  const regexp = new RegExp(s, "i");

  const { tokenIcon, disabled, circleIcon, size } = args;

  return (
    <Container>
      <SearchInput value={search} onChange={setSearch} />
      <ScrollArea
        gridTemplateColumns="repeat(auto-fill, 100px);"
        gridTemplateRows="repeat(auto-fill, 100px);"
        gridGap={4}
        mt={4}
      >
        {Object.keys(cryptoIcons)
          .sort((a, b) => {
            return s ? b.toLowerCase().indexOf(s) - a.toLowerCase().indexOf(s) : a.localeCompare(b);
          })
          // @ts-expect-error FIXME I don't know how to make you happy ts
          .map((name: keyof typeof cryptoIcons) => {
            const match = name.match(regexp);
            const active = s && match;
            const index = match?.index ?? 0;
            return (
              <IconContainer active={!!active}>
                <Flex flex={1} justifyContent="center" alignItems="center">
                  <CryptoIcon
                    key={name}
                    name={name}
                    size={size}
                    color={color}
                    disabled={disabled}
                    circleIcon={circleIcon}
                    tokenIcon={tokenIcon}
                  />
                </Flex>
                <Text variant="extraSmall">
                  {active ? (
                    <>
                      {name.substr(0, index)}
                      <Bold>{name.substr(index, s.length)}</Bold>
                      {name.substr(index + s.length)}
                    </>
                  ) : (
                    name
                  )}
                </Text>
              </IconContainer>
            );
          })}
      </ScrollArea>
    </Container>
  );
};
const IconTemplate = (args: CryptoIconsProps) => {
  const color = args.color || undefined;

  return <CryptoIcon {...args} color={color} />;
};

export const ListCryptoIcons = ListTemplate.bind({});
export const SingleCryptoIcon = IconTemplate.bind({});
