import React from "react";
import { useRareSatsModel } from "./useRareSatsModel";
import TableContainer from "~/renderer/components/TableContainer";
import TableHeader from "LLD/features/Collectibles/components/Collection/TableHeader";
import Item from "./Item";
import { TableHeaderTitleKey } from "LLD/features/Collectibles/types/Collection";
import { Box, Flex } from "@ledgerhq/react-ui";
import { TableHeader as TableHeaderContainer } from "./TableHeader";

type ViewProps = ReturnType<typeof useRareSatsModel>;

function View({ rareSats }: ViewProps) {
  return (
    <Box>
      <TableContainer id="oridinals-inscriptions">
        <TableHeader titleKey={TableHeaderTitleKey.RareSats} />
        <TableHeaderContainer />
        <Flex flexDirection="column">
          {rareSats
            ? rareSats.map(rareSatGroup => (
                <Flex key={rareSatGroup.utxo_size} flexDirection="column">
                  {rareSatGroup.sats.map(rareSat => (
                    <Item
                      key={rareSat.name}
                      {...rareSat}
                      isMultipleRow={rareSatGroup.isMultipleRow}
                    />
                  ))}
                </Flex>
              ))
            : null}
          {/** wait for design */}
        </Flex>
      </TableContainer>
    </Box>
  );
}

const RareSats = () => {
  return <View {...useRareSatsModel({})} />;
};

export default RareSats;
