import React from "react";
import { Media, Skeleton } from "../../index";
import { Box, Text } from "@ledgerhq/react-ui";
import { rgba } from "~/renderer/styles/helpers";
import styled from "styled-components";
import { isNFTRow, isOrdinalsRow } from "LLD/features/Collectibles/utils/typeGuardsChecker";
import { RowProps as Props } from "LLD/features/Collectibles/types/Collection";
import TokenTitle from "./TokenTitle";
import IconContainer from "./IconContainer";

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
    return <>{(isNFTRow(props) || isOrdinalsRow(props)) && <Media size={32} {...props.media} />}</>;
  };

  const nftCount = () => {
    return (
      <>
        {isNFTRow(props) && (
          <Skeleton width={42} minHeight={24} barHeight={10} show={props.isLoading}>
            <Text ff="Inter|SemiBold" color="palette.text.shade100" fontSize={4} textAlign="right">
              {props.numberOfNfts || 0}
            </Text>
          </Skeleton>
        )}
        {isOrdinalsRow(props) && props.tokenIcons.length != 0 && (
          <IconContainer icons={props.tokenIcons} iconNames={props.rareSatName} />
        )}
      </>
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
        <TokenTitle
          tokenName={props.tokenName}
          isLoading={props.isLoading}
          collectionName={isOrdinalsRow(props) ? props.collectionName : undefined}
        />
      </Box>
      {nftCount()}
    </Container>
  );
};

export default TableRow;
