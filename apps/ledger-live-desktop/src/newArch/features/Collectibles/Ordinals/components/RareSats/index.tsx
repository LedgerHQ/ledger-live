import React from "react";
import { useRareSatsModel } from "./useRareSatsModel";
import TableContainer from "~/renderer/components/TableContainer";
import TableHeader from "LLD/features/Collectibles/components/Collection/TableHeader";
import Item from "./Item";
import { TableHeaderTitleKey } from "LLD/features/Collectibles/types/Collection";
import { Box, Flex } from "@ledgerhq/react-ui";
import { TableHeader as TableHeaderContainer } from "./TableHeader";
import { SimpleHashNft } from "@ledgerhq/live-nft/api/types";
import Loader from "../Loader";
import Error from "../Error";

type ViewProps = ReturnType<typeof useRareSatsModel> & {
  isLoading: boolean;
  isError: boolean;
  isFetched: boolean;
};

type Props = {
  rareSats: SimpleHashNft[];
  isLoading: boolean;
  isError: boolean;
  isFetched: boolean;
};

function View({ rareSats, isLoading, isError, isFetched }: ViewProps) {
  const isLoaded = isFetched;
  const hasRareSats = Object.values(rareSats).length > 0;
  const dataReady = isLoaded && hasRareSats;

  return (
    <Box>
      <TableContainer id="oridinals-raresats">
        <TableHeader titleKey={TableHeaderTitleKey.RareSats} />
        {isLoading && <Loader />}
        {isError && <Error />}
        {dataReady && <TableHeaderContainer />}
        <Flex flexDirection="column">
          {dataReady &&
            Object.entries(rareSats).map(([key, rareSatGroup]) => (
              <Flex key={key} flexDirection="column">
                {rareSatGroup.map((rareSat, index) => (
                  <Item key={index} {...rareSat} />
                ))}
              </Flex>
            ))}
          {isLoaded && !hasRareSats && (
            <Flex justifyContent="center" my={4}>
              {"NOTHING TO SHOW WAITING FOR DESIGN"}
            </Flex>
          )}
        </Flex>
      </TableContainer>
    </Box>
  );
}

const RareSats = ({ rareSats, isLoading, isError, isFetched }: Props) => {
  return (
    <View
      isFetched={isFetched}
      isLoading={isLoading}
      isError={isError}
      {...useRareSatsModel({ rareSats })}
    />
  );
};

export default RareSats;
