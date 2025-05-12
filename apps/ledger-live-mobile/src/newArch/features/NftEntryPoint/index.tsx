import React from "react";
import useNftsEntryPointViewModel from "./useNftsEntryPointViewModel";
import { Account } from "@ledgerhq/types-live";
import { Flex, Text } from "@ledgerhq/native-ui";
import SectionContainer from "~/screens/WalletCentricSections/SectionContainer";
import { useTranslation } from "react-i18next";

type Props = { currencyId: string } & ReturnType<typeof useNftsEntryPointViewModel>;

function ViewNftEntryPoint({
  isFeatureNftEntryPointEnabled,
  entryPoints,
  currencyId,
  chains,
}: Props) {
  const { t } = useTranslation();
  if (!isFeatureNftEntryPointEnabled || !chains.includes(currencyId)) {
    return null;
  }

  return (
    <SectionContainer key={"section-container-nfts"} px={6}>
      <Text variant="small" fontWeight="semiBold" color="neutral.c70" uppercase flexShrink={1}>
        {t("nftEntryPoint.title")}
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

const NftEntryPoint = ({ account }: { account: Account }) => (
  <ViewNftEntryPoint
    {...useNftsEntryPointViewModel({
      accountId: account.id,
      currencyId: account.currency.id,
    })}
  />
);

export default NftEntryPoint;
