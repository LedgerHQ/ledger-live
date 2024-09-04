import React from "react";
import { Media, Skeleton } from "../../index";
import { Box, Flex, Text } from "@ledgerhq/react-ui";
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

const SatsIconContainer = styled(Flex)`
  border-radius: 8px;
  background: ${p => p.theme.colors.opacityDefault.c05};
  border: 1px solid ${p => p.theme.colors.opacityDefault.c10};
  padding: 8px;
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
      <>
        {isNFTRow(props) && (
          <Skeleton width={42} minHeight={24} barHeight={10} show={props.isLoading}>
            <Text ff="Inter|SemiBold" color="palette.text.shade100" fontSize={4} textAlign="right">
              {props.numberOfNfts || 0}
            </Text>
          </Skeleton>
        )}
        {isOrdinalsRow(props) && props.tokenIcons.length != 0 && (
          <SatsIconContainer
            p={"8px"}
            alignItems={"center"}
            justifyContent={"center"}
            flexDirection={"row"}
            columnGap={"12px"}
          >
            {props.tokenIcons?.map((Icon, index) => (
              <Icon key={index} size={"XS"} color={"neutral.c100"} />
            ))}
          </SatsIconContainer>
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
      maxHeight={64}
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
