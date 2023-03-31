import React, { useState } from "react";
import styled from "styled-components";
import Icon, { iconNames, Props as IconProps } from "./Icon";
import { useTheme } from "styled-components";
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
  title: "Asorted/Icons",
  argTypes: {
    weight: {
      type: "enum",
      description: "Weight (Deprecated)",
      defaultValue: "Medium",
      control: {
        options: ["Medium"],
        control: {
          type: "select",
        },
      },
    },
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
      defaultValue: "Activity",
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

const ListTemplate = (args: IconProps) => {
  const theme = useTheme();
  const color = args.color || theme.colors.neutral.c100;
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
                  <Icon
                    key={name}
                    name={name}
                    weight={args.weight}
                    size={args.size}
                    color={color}
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
const IconTemplate = (args: IconProps) => {
  const theme = useTheme();
  const color = args.color || theme.colors.neutral.c100;

  return <Icon {...args} color={color} />;
};

export const List = ListTemplate.bind({});
export const SingleIcon = IconTemplate.bind({});
