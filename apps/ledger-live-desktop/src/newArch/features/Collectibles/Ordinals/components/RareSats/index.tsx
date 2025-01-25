import React from "react";
import { useRareSatsModel } from "./useRareSatsModel";
import TableContainer from "~/renderer/components/TableContainer";
import TableHeader from "LLD/features/Collectibles/components/Collection/TableHeader";
import Item from "./Item";
import { TableHeaderTitleKey } from "LLD/features/Collectibles/types/Collection";
import { Box, Flex, Icons } from "@ledgerhq/react-ui";
import { TableHeader as TableHeaderContainer } from "./TableHeader";
import { SimpleHashNft } from "@ledgerhq/live-nft/api/types";
import Loader from "../Loader";
import Error from "../Error";
import EmptyCollection from "../../../components/Collection/EmptyCollection";
import { CollectibleTypeEnum } from "../../../types/enum/Collectibles";
import Button from "~/renderer/components/Button";
import { useTranslation } from "react-i18next";

type ViewProps = ReturnType<typeof useRareSatsModel> & {
  isLoading: boolean;
  isError: boolean;
  isFetched: boolean;
  error: Error | null;
  onReceive: () => void;
};

type Props = {
  rareSats: SimpleHashNft[];
  isLoading: boolean;
  isError: boolean;
  isFetched: boolean;
  error: Error | null;
  onReceive: () => void;
};

function View({ rareSats, isLoading, isError, isFetched, error, onReceive }: ViewProps) {
  const { t } = useTranslation();
  const isLoaded = isFetched && !isError && !isLoading;
  const hasRareSats = Object.values(rareSats).length > 0;
  const dataReady = isLoaded && hasRareSats;
  const hasError = isError && error;

  return (
    <Box>
      <TableContainer id="oridinals-raresats">
        <TableHeader titleKey={TableHeaderTitleKey.RareSats} />
        {isLoading && <Loader />}
        {hasError && <Error error={error} />}
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
            <EmptyCollection collectionType={CollectibleTypeEnum.RareSat}>
              <Button small primary onClick={onReceive} icon>
                <Flex alignItems={"center"}>
                  <Icons.ArrowDown size="XS" />
                  <Box>{t("ordinals.rareSats.receive")}</Box>
                </Flex>
              </Button>
            </EmptyCollection>
          )}
        </Flex>
      </TableContainer>
    </Box>
  );
}

const RareSats = ({ rareSats, isLoading, isError, isFetched, error, onReceive }: Props) => {
  return (
    <View
      isFetched={isFetched}
      isLoading={isLoading}
      isError={isError}
      error={error}
      onReceive={onReceive}
      {...useRareSatsModel({ rareSats })}
    />
  );
};

export default RareSats;
