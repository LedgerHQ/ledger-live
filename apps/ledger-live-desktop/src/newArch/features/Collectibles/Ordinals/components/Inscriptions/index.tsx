import React from "react";
import { Account } from "@ledgerhq/types-live";
import { Box, Flex } from "@ledgerhq/react-ui";
import { useInscriptionsModel } from "./useInscriptionsModel";
import TableContainer from "~/renderer/components/TableContainer";
import TableHeader from "LLD/features/Collectibles/components/Collection/TableHeader";
import { OrdinalsRowProps, TableHeaderTitleKey } from "LLD/features/Collectibles/types/Collection";
import TableRow from "LLD/features/Collectibles/components/Collection/TableRow";
import ShowMore from "LLD/features/Collectibles/components/Collection/ShowMore";
import { MediaProps } from "LLD/features/Collectibles/types/Media";

type ViewProps = ReturnType<typeof useInscriptionsModel>;

type Props = {
  account: Account;
};

export type InscriptionsItemProps = {
  isLoading: boolean;
  tokenName: string;
  collectionName: string;
  tokenIcons: OrdinalsRowProps["tokenIcons"];
  media: MediaProps;
  onClick: () => void;
};

const Item: React.FC<InscriptionsItemProps> = ({
  isLoading,
  tokenName,
  collectionName,
  tokenIcons,
  media,
  onClick,
}) => {
  return (
    <TableRow
      isLoading={isLoading}
      tokenName={tokenName}
      collectionName={collectionName}
      tokenIcons={tokenIcons}
      media={media}
      onClick={onClick}
    />
  );
};

function View({ displayedObjects, displayShowMore, onShowMore }: ViewProps) {
  return (
    <Box>
      <TableContainer id="oridinals-inscriptions">
        <TableHeader titleKey={TableHeaderTitleKey.Inscriptions} />
        {/** titlekey doesn't need to be translated so we keep it hard coded  */}
        {displayedObjects ? (
          displayedObjects.map((item, index) => (
            <Item
              key={index}
              isLoading={item.isLoading}
              tokenName={item.tokenName}
              collectionName={item.collectionName}
              tokenIcons={item.tokenIcons}
              media={item.media}
              onClick={item.onClick}
            />
          ))
        ) : (
          <Flex justifyContent={"center"} my={12}>
            {"NOTHING TO SHOW"}
          </Flex>
        )}
        {displayShowMore && <ShowMore onShowMore={onShowMore} />}
      </TableContainer>
    </Box>
  );
}

const Inscriptions: React.FC<Props> = ({ account }: Props) => {
  return <View {...useInscriptionsModel({ account })} />;
};

export default Inscriptions;
