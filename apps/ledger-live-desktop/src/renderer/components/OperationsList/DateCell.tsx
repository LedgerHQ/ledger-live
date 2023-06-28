import React, { PureComponent } from "react";
import styled from "styled-components";
import { Operation } from "@ledgerhq/types-live";
import { TFunction } from "react-i18next";
import Box from "~/renderer/components/Box";
import OperationDate from "./OperationDate";
import { InfiniteLoader } from "@ledgerhq/react-ui";
import { WarningSolidMedium } from "@ledgerhq/react-ui/assets/icons";
import { getEnv } from "@ledgerhq/live-common/env";
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
};
class DateCell extends PureComponent<Props> {
  static defaultProps = {
    withAccount: false,
  };

  // less than 5 minutes: loading spinner; more than 5 minutes: yellow warning icon
  pendingLoadingIcon(isOlderThan5Min: boolean) {
    if (isOlderThan5Min) {
      return (
        <Box style={{ verticalAlign: "sub", display: "inline" }}>
          <WarningSolidMedium size={12} color={"#FFBD42"} />
        </Box>
      );
    } else {
      return <InfiniteLoader size={12} style={{ verticalAlign: "middle" }} />;
    }
  }

  render() {
    const { t, operation, compact, text, editable } = this.props;
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
              {
                // display pending icon (less than 5 minutes: loading spinner; more than 5 minutes: yellow warning icon)
                this.pendingLoadingIcon(
                  new Date().getTime() - operation.date.getTime() >
                    getEnv("ETHEREUM_STUCK_TRANSACTION_TIMEOUT"),
                )
              }
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
  }
}
export default DateCell;
