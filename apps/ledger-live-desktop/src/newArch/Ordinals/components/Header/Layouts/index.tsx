import React from "react";
import { Flex, Icons } from "@ledgerhq/react-ui";
import { Layout, LayoutKey } from "~/newArch/Ordinals/types/Layouts";
import { neutral, primary, Element } from "../utils";

type Props = {
  layoutOptions: Record<LayoutKey, Layout>;
  changeLayout: (layoutSelected: Layout) => void;
  layout: LayoutKey;
};

const IconsMode = {
  grid: <Icons.Grid size="S" />,
  list: <Icons.MenuBurger size="S" />,
};

const Layouts = ({ layoutOptions, changeLayout, layout }: Props) => {
  return (
    <Flex
      py={2}
      px={3}
      backgroundColor="opacityDefault.c05"
      borderRadius={32}
      justifyContent="space-between"
    >
      {Object.entries(layoutOptions).map(([key, value], index) => (
        <Element
          alignItems="center"
          onClick={() => changeLayout(value)}
          key={key}
          color={layout === key ? primary : neutral}
          ml={index === 0 ? 0 : 2}
        >
          {IconsMode[key as LayoutKey]}
        </Element>
      ))}
    </Flex>
  );
};

export default Layouts;
