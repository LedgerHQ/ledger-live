import React from "react";
import { Flex, InfiniteLoader, Text } from "@ledgerhq/react-ui";
import { SatsRow } from "./Sats";
import TableContainer, { HeaderWrapper } from "~/renderer/components/TableContainer";

import { useTranslation } from "react-i18next";
import { useNftGallery } from "../../hooks/useNftGallery";

export const RareSats = () => {
  const { nfts, isLoading } = useNftGallery({
    addresses: "bc1pgtat0n2kavrz4ufhngm2muzxzx6pcmvr4czp089v48u5sgvpd9vqjsuaql",
    standard: "raresats",
  });
  console.log(nfts);
  return (
    <TableContainer flex={1}>
      <SectionTitle />
      {isLoading ? (
        <Flex alignItems="center" justifyContent="center">
          <InfiniteLoader />
        </Flex>
      ) : (
        <>
          {nfts.map((nft, index) => (
            <SatsRow key={index} ordinal={nft} isLast={index === nfts.length - 1} />
          ))}
        </>
      )}
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
