import React from "react";
import RowLayout from "LLD/features/Collectibles/Ordinals/components/RareSats/RowLayout";
import IconContainer from "LLD/features/Collectibles/components/Collection/TableRow/IconContainer";
import TokenTitle from "LLD/features/Collectibles/components/Collection/TableRow/TokenTitle";
import { RareSat } from "LLD/features/Collectibles/types/Ordinals";
import { Text, Flex } from "@ledgerhq/react-ui";

const Item = ({
  icons,
  name,
  year,
  count,
  utxo_size,
  isMultipleRow,
}: RareSat & { isMultipleRow: boolean }) => {
  const firstColumn = (
    <Flex columnGap={2}>
      {icons && <IconContainer icons={Object.values(icons)} />}
      <TokenTitle tokenName={[name]} complementaryData={count} isLoading={false} />
    </Flex>
  );
  const secondColumn = (
    <Text variant="bodyLineHeight" fontSize={12} color="neutral.c70">
      {year}
    </Text>
  );
  const thirdColumn = (
    <Text variant="bodyLineHeight" fontSize={12} color="neutral.c70">
      {utxo_size}
    </Text>
  );

  return (
    <RowLayout
      isMultipleRow={isMultipleRow}
      firstColumnElement={firstColumn}
      secondColumnElement={secondColumn}
      thirdColumnElement={thirdColumn}
    />
  );
};

export default Item;
