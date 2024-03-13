import React from "react";
import { Account } from "@ledgerhq/types-live";
import Header from "./components/Header";
import useMenuCategories from "./hooks/useMenuCategories";
import { Flex } from "@ledgerhq/react-ui";

type Props = { account: Account };

const Ordinals = ({ account }: Props) => {
  console.log(account.id);
  const { category } = useMenuCategories();

  console.log("MY CAT", category);
  return (
    <Flex p={6} mb={40} bg="palette.background.paper" borderRadius={6} flexDirection="column">
      <Header />
      <Flex flex={1} justifyContent="center" mt={6}>
        {category.Component()}
      </Flex>
    </Flex>
  );
};

export default Ordinals;
