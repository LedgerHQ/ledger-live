import React from "react";
import { Flex } from "@ledgerhq/react-ui";

import EthStakeIllustration from "../assets/EthStakeIlustration";
import { Provider } from "./Provider";
import { Account } from "@ledgerhq/types-live";
import { ProvidersV2 } from "../types";

type Props = {
  listProviders: ProvidersV2;
  account: Account;
  onClose?: () => void;
  source?: string;
};

export function EthStakingModalBody({ listProviders, account, source, onClose }: Props) {
  return (
    <Flex flexDirection="column" alignItems="center" width="100%">
      <EthStakeIllustration size={140} />
      <Flex flexDirection="column" mt={7} px={20} width="100%">
        <Flex flexDirection={"column"} width="100%">
          {listProviders.map(provider => (
            <Flex key={provider.id} width="100%" flexDirection={"column"}>
              <Provider provider={provider} account={account} source={source} onClose={onClose} />
            </Flex>
          ))}
        </Flex>
      </Flex>
    </Flex>
  );
}
