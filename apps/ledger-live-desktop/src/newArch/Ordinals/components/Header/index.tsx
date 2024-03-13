import React from "react";
import { Flex, Text } from "@ledgerhq/react-ui";
import { t } from "i18next";
import Categories from "./Categories";
import Layouts from "./Layouts";
import { Category } from "../../types/Categories";
import { Layout, LayoutKey } from "../../types/Layouts";

type Props = {
  changeCategorySelected: (categorySelectedIndex: number) => void;
  categories: Category[];
  activeCategory: Category;
  layoutOptions: Record<LayoutKey, Layout>;
  changeLayout: (layoutSelected: Layout) => void;
  layout: LayoutKey;
};

const Header = ({
  changeCategorySelected,
  categories,
  activeCategory,
  layoutOptions,
  changeLayout,
  layout,
}: Props) => {
  return (
    <Flex flex={1} flexDirection="row" justifyContent="space-between" alignItems="center">
      <Flex>
        <Text>{t("account.ordinals.title")}</Text>
      </Flex>
      <Flex rowGap={6} alignItems="center">
        <Flex rowGap={6} alignItems="center">
          <Categories
            changeCategorySelected={changeCategorySelected}
            categories={categories}
            activeCategory={activeCategory}
          />
        </Flex>
        <Flex alignItems="center">
          <Layouts layoutOptions={layoutOptions} layout={layout} changeLayout={changeLayout} />
        </Flex>
      </Flex>
    </Flex>
  );
};

export default Header;
