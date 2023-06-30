import React from "react";
import styled from "styled-components";
import { rgba } from "~/renderer/styles/helpers";
import Card from "~/renderer/components/Box/Card";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import ToolTip from "./Tooltip";
import InfoCircle from "../icons/InfoCircle";
import TriangleWarning from "../icons/TriangleWarning";
import BigNumber from "bignumber.js";
import { useTranslation } from "react-i18next";

const TableContainer = styled(Card)`
  border-radius: 4px;
  overflow: hidden;
`;

const TableHeaderRow = styled(Box).attrs(() => ({
  flex: 1,
  py: 3,
  px: 4,
  horizontal: true,
  justifyContent: "space-between",
  alignItems: "center",
  alignContent: "center",
}))`
  border-bottom: 1px solid ${p => p.theme.colors.palette.text.shade10};
`;

export const HeaderWrapper = styled.div`
  display: flex;
  flex-direction: row;
  padding: 10px 20px;
  border-bottom: 1px solid ${p => p.theme.colors.palette.divider};
  background-color: ${p => rgba(p.theme.colors.palette.secondary.main, 0.02)};
`;

const TableHeaderTitle = styled(Text).attrs(() => ({
  color: "palette.text.shade100",
  ff: "Inter|Medium",
}))`
  font-size: 14px;
`;

export const TableRow = styled(Box)`
  align-items: center;
  flex-direction: row;
  color: #abadb6;
  cursor: pointer;
  display: flex;
  padding: 20px;
  :hover {
    background: ${p => rgba(p.theme.colors.wallet, 0.04)};
  }
`;

type TableHeaderProps = {
  title?: React.ReactNode;
  children?: React.ReactNode;
  titleProps?: React.ComponentProps<typeof TableHeaderTitle>;
  tooltip?: React.ReactNode;
  historyLowestBlock?: BigNumber;
};

const TableHeaderTooltip = ({ tooltip, title, titleProps }: TableHeaderProps) =>
  tooltip ? (
    <ToolTip content={tooltip}>
      <Box horizontal alignItems="center">
        <TableHeaderTitle {...titleProps}>{title}</TableHeaderTitle>
        &nbsp;
        <InfoCircle size={16} />
      </Box>
    </ToolTip>
  ) : null;

const IncompleteHistoryWarningTooltip = ({ tooltip, title, titleProps }: TableHeaderProps) => (
  <ToolTip content={tooltip}>
    <Box horizontal alignItems="center">
      <TableHeaderTitle {...titleProps}>{title}</TableHeaderTitle>
      &nbsp;
      <TriangleWarning size={16} />
    </Box>
  </ToolTip>
);

export const TableHeader = ({
  title,
  children,
  titleProps,
  tooltip,
  historyLowestBlock,
}: TableHeaderProps) => {
  const { t } = useTranslation();
  return (
    <TableHeaderRow>
      {title ? (
        tooltip ? (
          <TableHeaderTooltip title={title} tooltip={tooltip} titleProps={titleProps} />
        ) : historyLowestBlock?.isGreaterThan(1) ? (
          <IncompleteHistoryWarningTooltip
            title={title}
            titleProps={titleProps}
            tooltip={t("banners.incompleteHistory.description", {
              block: historyLowestBlock.toString(),
            })}
          />
        ) : (
          <TableHeaderTitle {...titleProps}>{title}</TableHeaderTitle>
        )
      ) : null}
      {children ? <Box horizontal>{children}</Box> : null}
    </TableHeaderRow>
  );
};

export default TableContainer;
