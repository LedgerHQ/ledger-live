// @flow

import React, { useState } from "react";
import { Trans } from "react-i18next";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { STAKE_METHOD } from "@ledgerhq/live-common/families/hedera/types";
import { capitalize } from "@ledgerhq/live-common/families/hedera/utils";

import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";

import DeclineRewardsCheckBox from "../components/DeclineRewardsCheckBox";
import StakeMethodSelect from "../components/StakeMethodSelect";
import StakeToNodeSelect from "../components/StakeToNodeSelect";
import StakeToAccountInput from "../components/StakeToAccountInput";

import type { StakeMethod } from "@ledgerhq/live-common/families/hedera/types";
import type { StepProps } from "../types";

const StepStakingInfo = ({
  account,
  parentAccount,
  onUpdateTransaction,
  transaction,
  status,
  bridgePending,
  warning,
  error,
  t,
  nodeListOptions,
}: StepProps) => {
  const bridge = getAccountBridge(account, parentAccount);

  const stakeMethods = [
    {
      label: capitalize(STAKE_METHOD.NODE),
      key: STAKE_METHOD.NODE,
    },
    {
      label: capitalize(STAKE_METHOD.ACCOUNT),
      key: STAKE_METHOD.ACCOUNT,
    },
  ];

  const [stakeMethod, setStakeMethod] = useState(
    transaction?.staked?.stakeMethod ?? STAKE_METHOD.NODE,
  );

  const [stakeToAccount, setStakeToAccount] = useState(transaction?.staked?.accountId ?? "");
  const [stakeToNode, setStakeToNode] = useState(transaction?.staked?.nodeId ?? null);
  const [declineRewards, setDeclineRewards] = useState(
    transaction?.staked?.declineRewards ?? false,
  );

  const handleAccountIdChange = accountId => {
    setStakeToAccount(accountId);

    onUpdateTransaction(transaction =>
      bridge.updateTransaction(transaction, {
        staked: {
          ...transaction.staked,

          accountId: accountId,
          stakeMethod: STAKE_METHOD.ACCOUNT,
        },
      }),
    );
  };

  const handleNodeIdChange = ({ value: nodeId }) => {
    setStakeToNode(nodeId);

    onUpdateTransaction(transaction =>
      bridge.updateTransaction(transaction, {
        staked: {
          ...transaction.staked,

          nodeId: nodeId,
          stakeMethod: STAKE_METHOD.NODE,
        },
      }),
    );
  };

  const handleDeclineRewardsChange = result => {
    setDeclineRewards(result);

    onUpdateTransaction(transaction =>
      bridge.updateTransaction(transaction, {
        staked: {
          ...transaction.staked,

          declineRewards: result,
        },
      }),
    );
  };

  const handleStakeMethodChange = ({ key: stakeMethod }: { key: StakeMethod }) => {
    // need to update bridge `transaction` to trigger for `status` errors
    clearOtherStakeMethod(stakeMethod);
  };

  /**
   * If @param stakeMethod is `StakeMethod.NODE`, clear account id input on UI and bridge `transaction`
   * If @param stakeMethod is `StakeMethod.ACCOUNT`, clear node id input on UI and bridge `transaction`
   */
  const clearOtherStakeMethod = (stakeMethod: StakeMethod) => {
    setStakeMethod(stakeMethod);

    if (stakeMethod === STAKE_METHOD.NODE) {
      setStakeToAccount("");

      onUpdateTransaction(transaction =>
        bridge.updateTransaction(transaction, {
          staked: {
            ...transaction.staked,

            accountId: null,
            stakeMethod,
          },
        }),
      );
    }

    if (stakeMethod === STAKE_METHOD.ACCOUNT) {
      setStakeToNode(null);

      onUpdateTransaction(transaction =>
        bridge.updateTransaction(transaction, {
          staked: {
            ...transaction.staked,

            nodeId: null,
            stakeMethod,
          },
        }),
      );
    }
  };

  return (
    <Box
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "start",
        alignItems: "center",
      }}
    >
      {/* stake method selector */}
      <StakeMethodSelect
        items={stakeMethods}
        activeKey={stakeMethod}
        onChange={handleStakeMethodChange}
      />

      <div
        style={{
          marginBottom: 30,
        }}
      >
        {/* stake to node */}
        {stakeMethod === STAKE_METHOD.NODE ? (
          <StakeToNodeSelect
            selected={stakeToNode}
            nodeListOptions={nodeListOptions}
            onChange={handleNodeIdChange}
          />
        ) : null}

        {/* stake to account */}
        {stakeMethod === STAKE_METHOD.ACCOUNT ? (
          <StakeToAccountInput
            account={account}
            status={status}
            value={stakeToAccount}
            onChange={handleAccountIdChange}
            t={t}
          />
        ) : null}
      </div>

      {/* `Receive rewards` checkbox */}
      <DeclineRewardsCheckBox isChecked={declineRewards} onChange={handleDeclineRewardsChange} />
    </Box>
  );
};

export const StepStakingInfoFooter = ({
  t,
  bridgePending,
  status,
  transitionTo,
  account,
  transaction,
  parentAccount,
  optimisticOperation,
}: StepProps) => {
  const { errors } = status;

  const isTerminated = account && account.currency.terminated;
  const hasFieldError = Object.keys(errors).some(name => name === "stakeInput");

  const canNext = !bridgePending && !hasFieldError && !isTerminated;

  return (
    <Button
      primary
      isLoading={bridgePending}
      disabled={!canNext}
      onClick={() => transitionTo("summary")}
    >
      <Trans i18nKey="common.continue" />
    </Button>
  );
};

export default StepStakingInfo