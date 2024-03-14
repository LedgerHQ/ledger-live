import React from "react";
import { Flex, InfiniteLoader, Text } from "@ledgerhq/react-ui";
import { SatsRow } from "./Sats";
import TableContainer, { HeaderWrapper } from "~/renderer/components/TableContainer";

import { useTranslation } from "react-i18next";
import { useNftGallery } from "../../hooks/useNftGallery";
import { Account } from "@ledgerhq/types-live";
import { t } from "i18next";
import { Ordinal } from "../../types/Ordinals";

type Props = {
  account: Account;
};

export const RareSats = ({ account }: Props) => {
  console.log("account", JSON.stringify(account, null, 2));
  const addresses = account.operations.filter(op => op.type === "IN").map(op => op.recipients[0]);
  const { nfts: allNfts, isLoading } = useNftGallery({
    addresses: addresses[0] || "bc1pgtat0n2kavrz4ufhngm2muzxzx6pcmvr4czp089v48u5sgvpd9vqjsuaql",
    standard: "raresats",
    threshold: 10,
  });
  const nfts: Ordinal[] = allNfts.filter((ordi: Ordinal) => {
    const satributes = ordi.metadata.utxo_details?.satributes;
    if (satributes) {
      const keys = Object.keys(satributes || {});
      return keys[0] !== "common" || keys.length > 1;
    }
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
          {t("account.ordinals.noRareSats")}
        </Text>
      </Flex>
    );
  return (
    <TableContainer flex={1}>
      <SectionTitle />
      {nfts.map((nft, index) => (
        <SatsRow key={index} ordinal={nft} isLast={index === nfts.length - 1} />
      ))}
    </TableContainer>
  );
};

const SectionTitle = () => {
  const { t } = useTranslation();
  return (
    <HeaderWrapper
      style={{
        justifyContent: "space-between",
      }}
    >
      <Flex width={"90%"} justifyContent={"space-between"} mr={2}>
        <Text fontWeight="semiBold" fontSize={3} color={"neutral.c70"}>
          {t("account.ordinals.rareSats.list.header.typeAmount")}
        </Text>

        <Text fontWeight="semiBold" fontSize={3} color={"neutral.c70"}>
          {t("account.ordinals.rareSats.list.header.year")}
        </Text>
      </Flex>

      <Flex width={"10%"} justifyContent="center">
        <Text fontWeight="semiBold" fontSize={3} color={"neutral.c70"}>
          {t("account.ordinals.rareSats.list.header.utxo")}
        </Text>
      </Flex>
    </HeaderWrapper>
  );
};
