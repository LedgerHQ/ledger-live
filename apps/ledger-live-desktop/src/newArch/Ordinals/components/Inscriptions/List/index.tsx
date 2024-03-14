import { Flex, Text } from "@ledgerhq/react-ui";
import { Ordinal } from "../../../types/Ordinals";
import React from "react";

const InscriptionsList = ({ data }: { data: Ordinal[] }) => (
  <Flex flex={1} rowGap={2} flexDirection="column">
    {data.map((ordinal, i) => (
      <Flex key={i} bg="neutral.c30" p={2} borderRadius={6}>
        <Text>{ordinal.name ?? ordinal.contract.name}</Text>
      </Flex>
    ))}
  </Flex>
);

export default InscriptionsList;
