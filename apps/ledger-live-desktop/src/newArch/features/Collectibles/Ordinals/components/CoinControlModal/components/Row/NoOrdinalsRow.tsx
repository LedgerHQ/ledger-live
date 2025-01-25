import React from "react";
import { Flex, Text } from "@ledgerhq/react-ui";
import { SplitAddress, Cell } from "~/renderer/components/OperationsList/AddressCell";
import { useTranslation } from "react-i18next";

type Props = {
  outputIndex: number;
  hash: string;
  address: string;
};

const NoOrdinalsRow: React.FC<Props> = ({ outputIndex, hash, address }) => {
  const { t } = useTranslation();
  return (
    <Flex
      flex={1}
      width="100%"
      borderBottom={1}
      borderBottomLeftRadius={8}
      borderBottomRightRadius={8}
      flexDirection="column"
      p={15}
      overflowX="hidden"
      rowGap={18}
    >
      <Flex flexDirection="row" justifyContent="space-between" alignItems={"center"}>
        <Text variant="subtitle" color="neutral.c70" fontSize={11}>
          {t("ordinals.coinControl.address")}
        </Text>
        <Flex width={150}>
          <Cell px={0} pl={2}>
            <SplitAddress fontSize={13} value={address} ff="Inter|Regular" />
          </Cell>
        </Flex>
      </Flex>
      <Flex flexDirection="row" justifyContent="space-between" alignItems="center">
        <Text variant="subtitle" flex={1} color="neutral.c70" fontSize={11}>
          {t("ordinals.coinControl.transactionId")}
        </Text>
        <Flex alignItems="center">
          <Text variant="subtitle" color="neutral.c70" fontSize={11}>
            #{outputIndex} {t("ordinals.coinControl.of")}
          </Text>
          <Cell px={0} pl={2}>
            <SplitAddress fontSize={13} value={hash} ff="Inter|Regular" />
          </Cell>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default NoOrdinalsRow;
