import React from "react";
import { Flex } from "@ledgerhq/react-ui";
import { Providers } from "./types";
import EthStakeIllustration from "../assets/EthStakeIlustration";
import { Provider } from "./Provider";
import { Account } from "@ledgerhq/types-live";

type Props = {
  onClose?: () => void;
  providers: Providers;
  account: Account;
};

export function EthStakingModalBody({ providers, account }: Props) {
  return (
    <Flex flexDirection="column" alignItems="center" width="100%">
      <EthStakeIllustration size={140} />
      <Flex flexDirection="column" mt={7} px={20} width="100%">
        <Flex flexDirection={"column"} width="100%">
          {providers.map(provider => (
            <Flex key={provider.liveAppId} width="100%" flexDirection={"column"}>
              <Provider provider={provider} account={account} />
            </Flex>
          ))}
        </Flex>
      </Flex>
    </Flex>
  );
}
