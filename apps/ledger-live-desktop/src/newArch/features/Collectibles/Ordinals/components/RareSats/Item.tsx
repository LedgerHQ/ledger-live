import React from "react";
import RowLayout from "LLD/features/Collectibles/Ordinals/components/RareSats/RowLayout";
import IconContainer from "LLD/features/Collectibles/components/Collection/TableRow/IconContainer";
import TokenTitle from "LLD/features/Collectibles/components/Collection/TableRow/TokenTitle";
import { Text, Flex } from "@ledgerhq/react-ui";
import { RareSat } from "LLD/features/Collectibles/types/Ordinals";

const Item = ({ icons, names, displayed_names, year, count, isMultipleRow }: RareSat) => {
  const firstColumn = (
    <Flex columnGap={2}>
      {icons && <IconContainer icons={Object.values(icons)} iconNames={names} />}
      <TokenTitle tokenName={[displayed_names]} complementaryData={count} isLoading={false} />
    </Flex>
  );
  const secondColumn = (
    <Text variant="bodyLineHeight" fontSize={12} color="neutral.c70">
      {year}
    </Text>
  );

  return (
    <RowLayout
      isMultipleRow={isMultipleRow}
      firstColumnElement={firstColumn}
      secondColumnElement={secondColumn}
    />
  );
};

export default Item;
