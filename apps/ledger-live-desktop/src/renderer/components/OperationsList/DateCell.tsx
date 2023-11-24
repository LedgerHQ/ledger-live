import { isStuckOperation } from "@ledgerhq/live-common/operation";
import { InfiniteLoader } from "@ledgerhq/react-ui";
import { WarningSolidMedium } from "@ledgerhq/react-ui/assets/icons";
import { Operation } from "@ledgerhq/types-live";
import { TFunction } from "i18next";
import React from "react";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import OperationDate from "./OperationDate";

const Cell = styled(Box).attrs(() => ({
  px: 3,
  horizontal: false,
}))<{
  compact?: boolean;
}>`
  width: auto;
  min-width: ${p => (p.compact ? 90 : 120)}px;
`;

type Props = {
  t: TFunction;
  family: string;
  operation: Operation;
  text?: string;
  compact?: boolean;
  editable?: boolean;
};

const PendingLoadingIcon = ({ displayWarning }: { displayWarning: boolean }): JSX.Element => {
  if (displayWarning) {
    return (
      <Box style={{ verticalAlign: "sub", display: "inline" }}>
        <WarningSolidMedium size={12} color={"#FFBD42"} />
      </Box>
    );
  }

  return <InfiniteLoader size={12} style={{ verticalAlign: "middle" }} />;
};

const DateCell = ({ t, family, operation, compact, text, editable }: Props): JSX.Element => {
  const ellipsis = {
    display: "block",
    textOverflow: "ellipsis",
    overflow: "hidden",
    whiteSpace: "nowrap" as const,
  };

  return (
    <Cell compact={compact}>
      <Box ff="Inter|SemiBold" fontSize={3} color="palette.text.shade80" style={ellipsis}>
        {text ||
          t(operation.hasFailed ? "operationDetails.failed" : `operation.type.${operation.type}`)}
      </Box>
      {editable ? (
        <Box fontSize={3} color="palette.text.shade80">
          <Box ff="Inter|SemiBold" fontSize={3} color="palette.text.shade80" style={ellipsis}>
            <PendingLoadingIcon displayWarning={isStuckOperation({ family, operation })} />
            <Box
              style={{
                marginLeft: "4px",
                verticalAlign: "middle",
                display: "inline-block",
                fontSize: "10px",
              }}
            >
              {t("operation.type.SENDING") + "..."}
            </Box>
          </Box>
        </Box>
      ) : (
        <OperationDate date={operation.date} />
      )}
    </Cell>
  );
};

export default DateCell;
