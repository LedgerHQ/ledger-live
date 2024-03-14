import React from "react";
import { useNftGallery } from "../../hooks/useNftGallery";
import { LayoutKey } from "../../types/Layouts";
import InscriptionsGrid from "./Grid";
import InscriptionsList from "./List";
import { Account } from "@ledgerhq/types-live";
import { Flex, InfiniteLoader, Text } from "@ledgerhq/react-ui";
import { t } from "i18next";

type Props = {
  layout: LayoutKey;
  account: Account;
};

export function Inscriptions({ layout, account }: Props) {
  console.log("account", JSON.stringify(account, null, 2));
  const addresses = account.operations.filter(op => op.type === "IN").map(op => op.recipients[0]);
  const { nfts, isLoading } = useNftGallery({
    addresses: addresses[0] || "bc1pgtat0n2kavrz4ufhngm2muzxzx6pcmvr4czp089v48u5sgvpd9vqjsuaql",
    standard: "inscriptions",
    threshold: 10,
  });
  if (isLoading)
    return (
      <Flex flex={1} alignItems="center" justifyContent="center" mb={40}>
        <InfiniteLoader />
      </Flex>
    );
  if (!nfts || nfts.length === 0)
    return (
      <Flex flex={1} flexDirection="column" alignItems="center" justifyContent="center" mb={40}>
        <Text variant="body" color="palette.text.shade60">
          {t("account.ordinals.noInscriptions")}
        </Text>
      </Flex>
    );

  return layout === "grid" ? (
    <InscriptionsGrid data={nfts || []} />
  ) : (
    <InscriptionsList data={nfts || []} />
  );
}
