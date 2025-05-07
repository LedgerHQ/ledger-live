import React from "react";
import useNftsEntryPointViewModel from "./useNftsEntryPointViewModel";
import { Flex } from "@ledgerhq/react-ui/index";
import { Header } from "./components/Header";
import { Card } from "~/renderer/components/Box";

type Props = { chainId: string } & ReturnType<typeof useNftsEntryPointViewModel>;

function ViewNftEntryPoint({ isFeatureNftEntryPointEnabled, entryPoints, chainId, chains }: Props) {
  if (!isFeatureNftEntryPointEnabled || !chains.includes(chainId)) {
    return null;
  }

  return (
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
}

const NftEntryPoint = ({ chainId }: { chainId: string }) => (
  <ViewNftEntryPoint {...useNftsEntryPointViewModel()} chainId={chainId} />
);

export default NftEntryPoint;
