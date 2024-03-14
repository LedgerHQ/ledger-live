import React from "react";
import { Flex, Text } from "@ledgerhq/react-ui";
import { t } from "i18next";
import Categories from "./Categories";
import { Category } from "../../types/Categories";

type Props = {
  changeCategorySelected: (categorySelectedIndex: number) => void;
  categories: Category[];
  activeCategory: Category;
};

const Header = ({ changeCategorySelected, categories, activeCategory }: Props) => {
  return (
    <Flex flex={1} flexDirection="row" justifyContent="space-between" alignItems="center">
      <Flex>
        <Text variant="large" fontWeight="semiBold">
          {t("account.ordinals.title")}
        </Text>
      </Flex>
      <Flex rowGap={6} alignItems="center">
        {/* {activeCategory.value !== "rareSats" && (
          <Flex alignItems="center" mr={2}>
            <Layouts layoutOptions={layoutOptions} layout={layout} changeLayout={changeLayout} />
          </Flex>
        )} */}
        <Flex rowGap={6} alignItems="center">
          <Categories
            changeCategorySelected={changeCategorySelected}
            categories={categories}
            activeCategory={activeCategory}
          />
        </Flex>
      </Flex>
    </Flex>
  );
};

export default Header;
