import React from "react";
import { Media, Skeleton } from "../../index";
import { Box, Text } from "@ledgerhq/react-ui";
import { rgba } from "~/renderer/styles/helpers";
import styled from "styled-components";
import {
  isNFTRow,
  isOrdinalsRow,
  isRareSatsRow,
} from "LLD/features/Collectibles/utils/typeGuardsChecker";
import { RowProps as Props } from "LLD/features/Collectibles/types/Collection";
import TokenTitle from "./TokenTitle";

const Container = styled(Box)`
  &.disabled {
    pointer-events: none;
  }

  &:not(:nth-child(2)) {
    border-top: 1px solid ${p => p.theme.colors.palette.text.shade10};
  }
  cursor: pointer;
  &:hover {
    background: ${p => rgba(p.theme.colors.wallet, 0.04)};
  }
`;

const TableRow: React.FC<Props> = props => {
  const mediaBox = () => {
    return (
      <>
        {(isNFTRow(props) || isOrdinalsRow(props)) && <Media size={32} {...props.media} />}
        {isRareSatsRow(props) && null}
      </>
    );
  };

  const nftCount = () => {
    return (
      <Skeleton width={42} minHeight={24} barHeight={10} show={props.isLoading}>
        {isNFTRow(props) && (
          <Text ff="Inter|SemiBold" color="palette.text.shade100" fontSize={4} textAlign="right">
            {props.numberOfNfts || 0}
          </Text>
        )}
        {isOrdinalsRow(props) && null}
      </Skeleton>
    );
  };

  return (
    <Container
      className={props.isLoading || process.env.ALWAYS_SHOW_SKELETONS ? "disabled" : ""}
      justifyContent="center"
      px={4}
      py={3}
      display={"flex"}
      onClick={props.onClick}
    >
      {mediaBox()}
      <Box ml={3} flex={1}>
        <TokenTitle tokenName={props.tokenName} isLoading={props.isLoading} />
      </Box>
      {nftCount()}
    </Container>
  );
};

export default TableRow;
