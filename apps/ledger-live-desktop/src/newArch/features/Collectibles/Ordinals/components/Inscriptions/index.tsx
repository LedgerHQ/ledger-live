import React from "react";
import { Box, Flex, Icons } from "@ledgerhq/react-ui";
import { useInscriptionsModel } from "./useInscriptionsModel";
import TableContainer from "~/renderer/components/TableContainer";
import TableHeader from "LLD/features/Collectibles/components/Collection/TableHeader";
import { TableHeaderTitleKey } from "LLD/features/Collectibles/types/Collection";
import ShowMore from "LLD/features/Collectibles/components/Collection/ShowMore";
import { SimpleHashNft } from "@ledgerhq/live-nft/api/types";
import Loader from "../Loader";
import Error from "../Error";
import Item from "./Item";
import EmptyCollection from "LLD/features/Collectibles/components/Collection/EmptyCollection";
import { CollectibleTypeEnum } from "../../../types/enum/Collectibles";
import Button from "~/renderer/components/Button";
import { useTranslation } from "react-i18next";

type ViewProps = ReturnType<typeof useInscriptionsModel> & {
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  onReceive: () => void;
};

type Props = {
  inscriptions: SimpleHashNft[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  onReceive: () => void;
  onInscriptionClick: (inscription: SimpleHashNft) => void;
};

const View: React.FC<ViewProps> = ({
  displayShowMore,
  isLoading,
  isError,
  inscriptions,
  error,
  onShowMore,
  onReceive,
}) => {
  const { t } = useTranslation();
  const hasInscriptions = inscriptions.length > 0 && !isError;
  const nothingToShow = !hasInscriptions && !isLoading && !isError;
  const hasError = isError && error;

  return (
    <Box>
      <TableContainer id="ordinals-inscriptions">
        <TableHeader titleKey={TableHeaderTitleKey.Inscriptions} />
        {isLoading && <Loader />}
        {hasError && <Error error={error} />}
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
          <EmptyCollection collectionType={CollectibleTypeEnum.Inscriptions}>
            <Button small primary onClick={onReceive} icon>
              <Flex alignItems={"center"}>
                <Icons.ArrowDown size="XS" />
                <Box>{t("ordinals.inscriptions.receive")}</Box>
              </Flex>
            </Button>
          </EmptyCollection>
        )}
        {displayShowMore && !isError && <ShowMore onShowMore={onShowMore} isInscriptions />}
      </TableContainer>
    </Box>
  );
};

const Inscriptions: React.FC<Props> = ({
  inscriptions,
  isLoading,
  isError,
  error,
  onReceive,
  onInscriptionClick,
}) => (
  <View
    isLoading={isLoading}
    isError={isError}
    error={error}
    onReceive={onReceive}
    {...useInscriptionsModel({ inscriptions, onInscriptionClick })}
  />
);

export default Inscriptions;
