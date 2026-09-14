import React from "react";
import { Flex } from "@ledgerhq/native-ui";

// Holds the route the staking entry points navigate to until the unbond and claim flows
// land (LIVE-32811, LIVE-32812).
export default function StakingFlowPlaceholder() {
  return <Flex flex={1} testID="aleo-staking-flow-placeholder" />;
}
