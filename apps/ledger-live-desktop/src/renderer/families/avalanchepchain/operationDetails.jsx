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
import Text from "~/renderer/components/Text";

type OperationDetailsExtraProps = {
  operation: Operation,
  extra: { [key: string]: any },
  type: string,
  account: Account,
};

const OperationDetailsExtra = ({ extra, operation, type, account }: OperationDetailsExtraProps) => {
  const { stakeValue, validator } = extra;
  const { avalanchePChainResources } = account;
  const { delegations } = avalanchePChainResources;
  const delegation = delegations.find(d => d.txID === operation.hash);
  const validatorNode = validator || delegation?.nodeID;

  //TODO: test this on testnet
  switch (type) {
    case "DELEGATE":
      return (
        <>
          {stakeValue && <OpDetailsSection>
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
          </OpDetailsSection>}
          {validatorNode && (
            <OpDetailsSection>
              <OpDetailsTitle>
                <Trans i18nKey="avalanchepchain.delegation.validator" />
              </OpDetailsTitle>
              <OpDetailsData>
                <Box>
                  <Text ff="Inter|SemiBold">{validatorNode}</Text>
                </Box>
              </OpDetailsData>
            </OpDetailsSection>
          )}
        </>
      );
    default:
      return null;
  }
};

export default {
  OperationDetailsExtra,
};
