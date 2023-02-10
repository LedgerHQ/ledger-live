// @flow

import React, { PureComponent } from "react";
import styled from "styled-components";
import type { Operation } from "@ledgerhq/types-live";
import type { TFunction } from "react-i18next";
import Box from "~/renderer/components/Box";
import OperationDate from "./OperationDate";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";
import { InfiniteLoader } from "@ledgerhq/react-ui";
import IconTriangleWarning from "~/renderer/icons/TriangleWarning";
import { FIVE_MINUTES_IN_MS } from "~/config/constants";

const Cell: ThemedComponent<{}> = styled(Box).attrs(() => ({
  px: 3,
  horizontal: false,
}))`
  width: auto;
  min-width: ${p => (p.compact ? 90 : 120)}px;
`;

type Props = {
  t: TFunction,
  operation: Operation,
  text?: string,
  compact?: boolean,
  editable?: boolean,
};

class DateCell extends PureComponent<Props> {
  static defaultProps = {
    withAccount: false,
  };

  // less than 5 minutes: loading spinner; more than 5 minutes: yellow warning icon
  pendingLoadingIcon(isOlderThan5Min) {
    if (isOlderThan5Min) {
      return (
        <Box style={{ verticalAlign: "top", display: "inline" }}>
          <IconTriangleWarning color={"yellow"} />
        </Box>
      );
    } else {
      return <InfiniteLoader size={25} style={{ verticalAlign: "middle" }} />;
    }
  }

  render() {
    const { t, operation, compact, text, editable } = this.props;
    const ellipsis = {
      display: "block",
      textOverflow: "ellipsis",
      overflow: "hidden",
      whiteSpace: "nowrap",
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
              {// display pending icon (less than 5 minutes: loading spinner; more than 5 minutes: yellow warning icon)
              this.pendingLoadingIcon(new Date() - operation.date > FIVE_MINUTES_IN_MS)}
              <Box style={{ verticalAlign: "middle", display: "inline-block", fontSize: "10px" }}>
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
