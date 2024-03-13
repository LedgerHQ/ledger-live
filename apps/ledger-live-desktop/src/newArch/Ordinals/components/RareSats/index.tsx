import React from "react";
import { Flex, Text } from "@ledgerhq/react-ui";
import { SatsRow } from "./Sats";
import TableContainer, { HeaderWrapper } from "~/renderer/components/TableContainer";

import { useTranslation } from "react-i18next";

export const RareSats = () => {
  return (
    <TableContainer flex={1}>
      <SectionTitle />
      {Array.from({ length: 10 }).map((_, index) => (
        <SatsRow
          collections={
            index % 2 === 0
              ? [
                  {
                    names: ["Nakamoto"],
                    nbSats: 20,
                    year: 2009,
                  },
                  {
                    names: ["Pizza"],
                    nbSats: 2,
                    year: 2017,
                  },
                  {
                    names: ["Hitman", "Vintage"],
                    nbSats: 2,
                    year: 2017,
                  },
                  {
                    names: ["Vintage"],
                    nbSats: 2,
                    year: 2018,
                  },
                  {
                    names: ["Alpha"],
                    year: 2011,
                    nbSats: 2,
                  },
                ]
              : [
                  {
                    names: ["Block78"],
                    nbSats: 2,
                    year: 2017,
                  },
                  {
                    names: ["Epic"],
                    nbSats: 34,
                    year: 2017,
                  },
                ]
          }
          utxo={320}
          key={index}
        />
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
