import { InfiniteLoader, IconsLegacy } from "@ledgerhq/react-ui";
import { Operation } from "@ledgerhq/types-live";
import { TFunction } from "i18next";
import React from "react";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import { getOperationTypeI18nKey } from "~/renderer/helpers/operationTypeI18nKey";
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
  operation: Operation;
  text?: string;
  compact?: boolean;
  editable?: boolean;
  isStuck?: boolean;
  family?: string;
};

const PendingLoadingIcon = ({ displayWarning }: { displayWarning: boolean }): React.JSX.Element => {
  if (displayWarning) {
    return (
      <Box style={{ verticalAlign: "sub", display: "inline" }}>
        <IconsLegacy.WarningSolidMedium size={12} color={"#FFBD42"} />
      </Box>
    );
  }

  return <InfiniteLoader size={12} style={{ verticalAlign: "middle" }} />;
};

const DateCell = ({
  t,
  operation,
  compact,
  text,
  editable,
  isStuck,
  family,
}: Props): React.JSX.Element => {
  const ellipsis = {
    display: "block",
    textOverflow: "ellipsis",
    overflow: "hidden",
    whiteSpace: "nowrap" as const,
  };

  return (
    <Cell compact={compact}>
      <Box
        ff="Inter|SemiBold"
        fontSize={3}
        color="neutral.c80"
        style={ellipsis}
        data-testid={`operation-status-${operation.id}`}
      >
        {text ||
          (operation.hasFailed
            ? t("operationDetails.failed")
            : t(getOperationTypeI18nKey(operation.type, family)))}
      </Box>
      {editable ? (
        <Box fontSize={3} color="neutral.c80">
          <Box ff="Inter|SemiBold" fontSize={3} color="neutral.c80" style={ellipsis}>
            <PendingLoadingIcon displayWarning={!!isStuck} />
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
