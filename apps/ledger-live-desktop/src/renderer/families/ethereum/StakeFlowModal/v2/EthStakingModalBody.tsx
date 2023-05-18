import React from "react";
import { Flex } from "@ledgerhq/react-ui";
import { Providers } from "./types";
import EthStakeIllustration from "../assets/EthStakeIlustration";
import { Provider } from "./Provider";
import { Account } from "@ledgerhq/types-live";

type Props = {
  providers: Providers;
  account: Account;
  onClose?: () => void;
  source?: string;
};

export function EthStakingModalBody({ providers, account, source }: Props) {
  return (
    <Flex flexDirection="column" alignItems="center" width="100%">
      <EthStakeIllustration size={140} />
      <Flex flexDirection="column" mt={7} px={20} width="100%">
        <Flex flexDirection={"column"} width="100%">
          {providers.map(provider => (
            <Flex key={provider.id} width="100%" flexDirection={"column"}>
              <Provider provider={provider} account={account} source={source} />
            </Flex>
          ))}
        </Flex>
      </Flex>
    </Flex>
  );
}
