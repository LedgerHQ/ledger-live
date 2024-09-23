import React from "react";
import { Box, Flex } from "@ledgerhq/react-ui";
import { useInscriptionsModel } from "./useInscriptionsModel";
import TableContainer from "~/renderer/components/TableContainer";
import TableHeader from "LLD/features/Collectibles/components/Collection/TableHeader";
import { TableHeaderTitleKey } from "LLD/features/Collectibles/types/Collection";
import ShowMore from "LLD/features/Collectibles/components/Collection/ShowMore";
import { SimpleHashNft } from "@ledgerhq/live-nft/api/types";
import Loader from "../Loader";
import Error from "../Error";
import Item from "./Item";

type ViewProps = ReturnType<typeof useInscriptionsModel> & { isLoading: boolean; isError: boolean };

type Props = {
  inscriptions: SimpleHashNft[];
  isLoading: boolean;
  isError: boolean;
};

const View: React.FC<ViewProps> = ({
  displayShowMore,
  isLoading,
  isError,
  inscriptions,
  onShowMore,
}) => {
  const hasInscriptions = inscriptions.length > 0 && !isError;
  const nothingToShow = !hasInscriptions && !isLoading && !isError;

  return (
    <Box>
      <TableContainer id="ordinals-inscriptions">
        <TableHeader titleKey={TableHeaderTitleKey.Inscriptions} />
        {isLoading && <Loader />}
        {isError && <Error />}
        {hasInscriptions &&
          inscriptions.map((item, index) => (
            <Item
              key={index}
              isLoading={isLoading}
              tokenName={item.tokenName}
              collectionName={item.collectionName}
              tokenIcons={item.tokenIcons}
              media={item.media}
              rareSatName={item.rareSatName}
              onClick={item.onClick}
            />
          ))}
        {nothingToShow && (
          <Flex justifyContent="center" my={4}>
            {"NOTHING TO SHOW WAITING FOR DESIGN"}
          </Flex>
        )}
        {displayShowMore && !isError && <ShowMore onShowMore={onShowMore} isInscriptions />}
      </TableContainer>
    </Box>
  );
};

const Inscriptions: React.FC<Props> = ({ inscriptions, isLoading, isError }) => (
  <View isLoading={isLoading} isError={isError} {...useInscriptionsModel({ inscriptions })} />
);

export default Inscriptions;
