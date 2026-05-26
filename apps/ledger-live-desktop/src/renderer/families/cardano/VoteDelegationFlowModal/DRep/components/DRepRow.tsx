import { getDefaultExplorerView, getDRepExplorer } from "@ledgerhq/live-common/explorers";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import React, { useCallback } from "react";
import styled, { css } from "styled-components";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import ExternalLink from "~/renderer/icons/ExternalLink";
import Check from "~/renderer/icons/Check";
import { openURL } from "~/renderer/linking";
import { DRep } from "@ledgerhq/live-common/families/cardano/DRep";
import { dayAndHourFormat, useDateFormatter } from "~/renderer/hooks/useDateFormatter";
import LedgerDRepIcon from "../../LedgerDRepIcon";

export const IconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background-color: ${p => p.theme.colors.neutral.c40};
  color: ${p => p.theme.colors.neutral.c70};
`;

const NameContainer = styled(Box).attrs(() => ({
  px: 2,
  horizontal: true,
  alignItems: "center",
}))`
  display: flex;
  justify-content: flex-start;
  width: 60%;
  ${IconContainer} {
    background-color: rgba(0, 0, 0, 0);
    color: ${p => p.theme.colors.primary.c80};
    opacity: 0;
  }
  &:hover {
    color: ${p => p.theme.colors.primary.c80};
  }
  &:hover > ${IconContainer} {
    opacity: 1;
  }
`;

const Title = styled(Box).attrs(() => ({
  horizontal: true,
  alignItems: "center",
  py: 1,
}))`
  width: min-content;
  max-width: 95%;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  color: ${p => p.theme.colors.neutral.c100};
  ${Text} {
    flex: 0 1 auto;
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const SubTitle = styled(Box).attrs(() => ({
  horizontal: true,
  alignItems: "center",
}))`
  font-size: 12px;
  font-weight: 500;
  color: ${p => p.theme.colors.neutral.c80};
  &:hover {
    color: ${p => p.theme.colors.primary.c80};
  }
  width: min-content;
  max-width: 95%;
  ${Text} {
    flex: 0 1 auto;
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const DateAndTimeContainer = styled(Box)`
  width: 30%;
  font-size: 12px;
`;
const SelectedCheckContainer = styled(Box).attrs(() => ({
  mx: 2,
  justifyContent: "center",
}))`
  width: 5%;
  align-self: center;
`;

const Row = styled(Box).attrs(() => ({
  horizontal: true,
  flex: "0 0 70px",
  mb: 2,
  alignItems: "center",
  justifyContent: "flex-start",
  p: 2,
}))<{
  disabled?: boolean;
}>`
  border-radius: 4px;
  border: 1px solid transparent;
  position: relative;
  overflow: visible;
  cursor: pointer;

  ${p =>
    p.onClick
      ? css`
          &:hover {
            border-color: ${p.theme.colors.primary.c80};
          }
          ${IconContainer} {
            opacity: 1;
            color: inherit;
          }
        `
      : ""}
`;

const StyledRow = styled(Row)`
  border-color: transparent;
  margin-bottom: 0;
`;

const ChosenMark = styled(Check).attrs<{
  active: boolean;
}>(p => ({
  color: p.active ? p.theme.colors.primary.c80 : "transparent",
  size: 14,
}))<{
  active?: boolean;
  size?: number;
}>``;

export type DRepRowProps = {
  currency: CryptoCurrency;
  dRep: DRep;
  active?: boolean;
  onClick: (v: DRep) => void;
};

function DRepRow({ dRep, active, onClick, currency }: DRepRowProps) {
  const explorerView = getDefaultExplorerView(currency);
  const formatDate = useDateFormatter(dayAndHourFormat);

  const onExternalLink = useCallback(
    (hex: string) => {
      const dRepURL = explorerView && getDRepExplorer(explorerView, hex);
      if (dRepURL) openURL(dRepURL);
    },
    [explorerView],
  );

  const lastActiveOn = (date: string) => formatDate(new Date(date));

  const onTitleClick: React.MouseEventHandler<HTMLDivElement> = useCallback(
    e => {
      e.stopPropagation();
      onExternalLink(dRep.hex);
    },
    [dRep, onExternalLink],
  );

  const onRowClick = useCallback(() => {
    onClick(dRep);
  }, [onClick, dRep]);

  return (
    <StyledRow onClick={onRowClick} data-testid="dRep-row">
      <LedgerDRepIcon dRep={dRep} />
      <NameContainer>
        <Box width={"100%"}>
          <Title>
            <Text data-testid="dRep-title">{dRep.meta?.givenName || ""}</Text>
          </Title>

          <SubTitle onClick={onTitleClick}>
            <Text>{dRep.hex}</Text>
            <IconContainer>
              <ExternalLink size={16} />
            </IconContainer>
          </SubTitle>
        </Box>
      </NameContainer>
      <DateAndTimeContainer>
        <Text>{lastActiveOn(dRep.active)}</Text>
      </DateAndTimeContainer>
      <SelectedCheckContainer>
        <ChosenMark active={active ?? true} />
      </SelectedCheckContainer>
    </StyledRow>
  );
}

export default DRepRow;
