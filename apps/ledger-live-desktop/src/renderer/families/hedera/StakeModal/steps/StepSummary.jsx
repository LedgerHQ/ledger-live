// @flow

import React from "react";
import { Trans } from "react-i18next";

import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import Text from "~/renderer/components/Text";

import type { StepProps } from "../types";

const StepSummary = ({ transaction }: StepProps) => {
  return (
    <Box mx={40}>
      {/* Stake to ... */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Text ff="Inter|Medium" color="palette.text.shade40" fontSize={4}>
          <Trans i18nKey="hedera.stake.flow.stake.to" />
        </Text>

        {/* ... node */}
        {transaction.staked.nodeId != null ? (
          <Text ff="Inter|Medium" color="palette.text.shade100" fontSize={4}>
            <Trans i18nKey="hedera.common.node" /> {transaction.staked.nodeId}
          </Text>
        ) : null}

        {/* ... account */}
        {transaction.staked.accountId != null ? (
          <Text ff="Inter|Medium" color="palette.text.shade100" fontSize={4}>
            <Trans i18nKey="hedera.common.account" />{" "}
            {transaction.staked.accountId}
          </Text>
        ) : null}
      </div>

      {/* Receive rewards? */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Text ff="Inter|Medium" color="palette.text.shade40" fontSize={4}>
          <Trans i18nKey="hedera.stake.flow.summary.receiveRewards" />
        </Text>

        <Text ff="Inter|Medium" color="palette.text.shade100" fontSize={4}>
          {!transaction.staked.declineRewards ? (
            <Trans i18nKey="hedera.common.yes" />
          ) : (
            <Trans i18nKey="hedera.common.no" />
          )}
        </Text>
      </div>
    </Box>
  );
};

export const StepSummaryFooter = ({ transitionTo }: StepProps) => {
  return (
    <Button primary onClick={() => transitionTo("connectDevice")}>
      <Trans i18nKey="hedera.common.continue" />
    </Button>
  );
};

export default StepSummary;