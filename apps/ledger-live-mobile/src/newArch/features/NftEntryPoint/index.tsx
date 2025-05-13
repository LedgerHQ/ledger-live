import React from "react";
import useNftsEntryPointViewModel from "./useNftsEntryPointViewModel";
import { Account } from "@ledgerhq/types-live";
import { Flex, Text } from "@ledgerhq/native-ui";
import SectionContainer from "~/screens/WalletCentricSections/SectionContainer";
import { Trans } from "react-i18next";
import { EntryPointNft } from "./types";

type Props = { readonly entryPoints: EntryPointNft };

function ViewNftEntryPoint({ entryPoints }: Props) {
  return (
    <SectionContainer key={"section-container-nfts"} px={6}>
      <Text variant="small" fontWeight="semiBold" color="neutral.c70" uppercase flexShrink={1}>
        <Trans i18nKey="nftEntryPoint.title" />
      </Text>
      <Flex flexDirection="column" mt={4}>
        {Object.entries(entryPoints).map(([entryPoint, { enabled, component: Component }]) => {
          if (!enabled) return null;
          return <Component key={entryPoint} />;
        })}
      </Flex>
    </SectionContainer>
  );
}

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
