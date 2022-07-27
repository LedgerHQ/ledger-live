// @flow
import React from "react";

import type { Operation, Account } from "@ledgerhq/live-common/types";

import {
  OpDetailsTitle,
  OpDetailsSection,
  OpDetailsData,
} from "~/renderer/drawers/OperationDetails/styledComponents";
import { Trans } from "react-i18next";
import Box from "~/renderer/components/Box";
import FormattedVal from "~/renderer/components/FormattedVal";

type OperationDetailsExtraProps = {
  operation: Operation,
  extra: { [key: string]: any },
  type: string,
  account: Account,
};

const OperationDetailsExtra = ({ extra, type, account }: OperationDetailsExtraProps) => {
  const { stakeValue } = extra;

  switch (type) {
    case "DELEGATE":
      return (
        <>
          <OpDetailsSection>
            <OpDetailsTitle>
              <Trans i18nKey={`operation.type.${type}`} />
            </OpDetailsTitle>
            <OpDetailsData>
              <Box>
                <FormattedVal
                  val={stakeValue}
                  unit={account.unit}
                  showCode
                  fontSize={4}
                  color="palette.text.shade60"
                />
              </Box>
            </OpDetailsData>
          </OpDetailsSection>
        </>
      );
    default:
      return null;
  }
};

export default {
  OperationDetailsExtra,
};
