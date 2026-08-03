import React from "react";
import { View } from "react-native";
import { Divider, Box } from "@ledgerhq/native-ui";
import type { AccountLike } from "@ledgerhq/types-live";
import type { CardanoAccount } from "@ledgerhq/live-common/families/cardano/types";
import CardanoDelegations from "./Delegations";
import CardanoVoteDelegation from "./VoteDelegation";

export default function CardanoAccountBodyHeader({ account }: { account: AccountLike }) {
  if (account.type !== "Account" || !(account as CardanoAccount).cardanoResources) return null;

  return (
    <View>
      <CardanoDelegations account={account} />
      <Box my={6}>
        <Divider />
      </Box>
      <CardanoVoteDelegation account={account} />
    </View>
  );
}
