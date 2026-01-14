import React from "react";
import useNftsEntryPointViewModel from "./useNftsEntryPointViewModel";
import { Flex } from "@ledgerhq/react-ui/index";
import { Header } from "./components/Header";
import { Card } from "~/renderer/components/Box";
import { Account } from "@ledgerhq/types-live";

type Props = { entryPoints: ReturnType<typeof useNftsEntryPointViewModel>["entryPoints"] };

const ViewNftEntryPoint = ({ entryPoints }: Readonly<Props>) => (
  <Card mb={50}>
    <Flex flexDirection="column">
      <Header />
      <Flex flexDirection="column">
        {Object.entries(entryPoints).map(([entryPoint, { enabled, component: Component }]) => {
          if (!enabled) return null;
          return <Component key={entryPoint} />;
        })}
      </Flex>
    </Flex>
  </Card>
);

const NftEntryPoint = ({ account }: { account: Account }) => {
  const { isFeatureNftEntryPointEnabled, entryPoints, chains, currencyId } =
    useNftsEntryPointViewModel({
      accountId: account.id,
      currencyId: account.currency.id,
    });

  if (!isFeatureNftEntryPointEnabled || !chains.includes(currencyId)) {
    return null;
  }

  return <ViewNftEntryPoint entryPoints={entryPoints} />;
};

export default NftEntryPoint;
