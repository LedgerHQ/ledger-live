import React from "react";
import { Flex, Text } from "@ledgerhq/react-ui";
import { t } from "i18next";
import Categories from "./Categories";
import Layouts from "./Layouts";

type Props = {
  changeCategorySelected: (categorySelectedIndex: number) => void;
  categories: any;
  layoutOptions: {
    grid: {
      value: string;
      label: any;
    };
    list: {
      value: string;
      label: any;
    };
  };
  changeLayout: (layoutSelected: any) => void;
  layout: string;
};

const Header = ({
  changeCategorySelected,
  categories,
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
          <Categories changeCategorySelected={changeCategorySelected} categories={categories} />
        </Flex>
        <Flex alignItems="center">
          <Layouts layoutOptions={layoutOptions} layout={layout} changeLayout={changeLayout} />
        </Flex>
      </Flex>
    </Flex>
  );
};

export default Header;
