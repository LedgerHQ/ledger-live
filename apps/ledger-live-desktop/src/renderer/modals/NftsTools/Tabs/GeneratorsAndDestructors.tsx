import { Divider, Flex } from "@ledgerhq/react-ui";
import React from "react";
import DeleteAccounts from "~/renderer/screens/settings/sections/Developer/NftsTools/screens/GeneratorsAndDestructors/DeleteAccounts";
import GenerateMockAccountsWithNfts from "~/renderer/screens/settings/sections/Developer/NftsTools/screens/GeneratorsAndDestructors/GenerateMockAccountsWithNfts";
import ResetHiddenCollections from "~/renderer/screens/settings/sections/Developer/NftsTools/screens/GeneratorsAndDestructors/ResetHiddenCollections";

export function GeneratorsAndDestructorsTab() {
  return (
    <Flex flexDirection="column" rowGap={2}>
      <ResetHiddenCollections />
      <Divider />
      <GenerateMockAccountsWithNfts />
      <Divider />
      <DeleteAccounts />
    </Flex>
  );
}
