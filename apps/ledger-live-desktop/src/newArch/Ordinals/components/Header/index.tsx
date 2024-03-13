import React from "react";
import { Flex, Text } from "@ledgerhq/react-ui";
import { t } from "i18next";
import Categories from "./Categories";
import Layouts from "./Layouts";

type Props = {};

const Header = ({}: Props) => {
  return (
    <Flex flex={1} flexDirection="row" justifyContent="space-between" alignItems="center">
      <Flex>
        <Text>{t("account.ordinals.title")}</Text>
      </Flex>
      <Flex rowGap={6} alignItems="center">
        <Flex rowGap={6} alignItems="center">
          <Categories />
        </Flex>
        <Flex alignItems="center">
          <Layouts />
        </Flex>
      </Flex>
    </Flex>
  );
};

export default Header;
