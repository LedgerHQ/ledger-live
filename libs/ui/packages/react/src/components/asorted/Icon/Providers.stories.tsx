import React, { useState } from "react";
import styled from "styled-components";
import ProviderIcon, {
  iconNames,
  Props as ProviderIconProps,
  sizes as providerSizes,
} from "./ProviderIcon";
import { Text, SearchInput, Flex, Grid } from "../../..";

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
  title: "Asorted/Icons/ProviderIcons",
  argTypes: {
    size: {
      type: "enum",
      description: "Icon size",
      defaultValue: "L",
      control: {
        options: Object.keys(providerSizes),
      },
    },
    boxed: {
      type: "boolean",
      description: "Boxed",
      defaultValue: false,
    },
    name: {
      type: "enum",
      defaultValue: "France",
      description: "[Only for single icon], Icon name",
      control: {
        options: iconNames,
        control: {
          type: "select",
        },
      },
    },
  },
};
export default Story;

const ListTemplate = (args: ProviderIconProps) => {
  const [search, setSearch] = useState("");
  const s = search.toLowerCase();
  const regexp = new RegExp(s, "i");

  return (
    <Container>
      <SearchInput value={search} onChange={setSearch} />
      <ScrollArea
        gridTemplateColumns="repeat(auto-fill, 100px);"
        gridTemplateRows="repeat(auto-fill, 100px);"
        gridGap={4}
        mt={4}
      >
        {iconNames
          .sort((a: string, b: string) => {
            return s ? b.toLowerCase().indexOf(s) - a.toLowerCase().indexOf(s) : a.localeCompare(b);
          })
          .map((name) => {
            const match = name.match(regexp);
            const active = s && match;
            const index = match?.index ?? 0;
            return (
              <IconContainer active={!!active}>
                <Flex flex={1} justifyContent="center" alignItems="center">
                  <ProviderIcon key={name} name={name} size={args.size} boxed={args.boxed} />
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
const FlagTemplate = (args: ProviderIconProps) => {
  return <ProviderIcon {...args} />;
};

export const List = ListTemplate.bind({});
export const SingleIcon = FlagTemplate.bind({});
