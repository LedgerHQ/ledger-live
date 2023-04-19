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
  transitionTo,
  bridgePending,
  continueClicked,
  warning,
  error,
  t,
  nodeListOptions,
  stakeMethod,
  setStakeMethod
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

  // const [stakeMethod, setStakeMethod] = useState(
  //   STAKE_METHOD.NODE,
  // );

  const [stakeToAccount, setStakeToAccount] = useState(transaction?.staked?.accountId ?? "");
  const [stakeToNode, setStakeToNode] = useState(transaction?.staked?.nodeId?.toString() ?? null);
  const [declineRewards, setDeclineRewards] = useState(
    transaction?.staked?.declineRewards ?? false,
  );

  // pseudo footer variables
  const { errors } = status;

  const isTerminated = account && account.currency.terminated;
  const hasFieldError = Object.keys(errors).some(name => name === "stakeInput");

  const canNext = !bridgePending && !hasFieldError && !isTerminated;

  // pseudo footer variables end

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

  const handleNodeIdChange = (nodeId: string) => {
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

    transitionTo("summary");
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

  const handleStakeMethodChange = (stakeMethod: string) => {
    // need to update bridge `transaction` to trigger for `status` errors
    clearOtherStakeMethod(stakeMethod);
  };

  /**
   * If @param stakeMethod is `StakeMethod.NODE`, clear account id input on UI and bridge `transaction`
   * If @param stakeMethod is `StakeMethod.ACCOUNT`, clear node id input on UI and bridge `transaction`
   */
  const clearOtherStakeMethod = (stakeMethod: string) => {
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
      {continueClicked == false ? (
        <StakeMethodSelect
          items={stakeMethods}
          activeKey={stakeMethod}
          selectNode={() => handleStakeMethodChange(STAKE_METHOD.NODE)}
          selectAccount={() => handleStakeMethodChange(STAKE_METHOD.ACCOUNT)}
        />
      ) : null}

      {/* <div
        style={{
          marginBottom: 30,
        }}
      > */}
      {/* stake to node */}
      {stakeMethod === STAKE_METHOD.NODE && continueClicked == true ? (
        <StakeToNodeSelect
          selected={stakeToNode}
          nodeListOptions={nodeListOptions}
          onChange={handleNodeIdChange}
        />
      ) : null}

      {/* stake to account */}
      {stakeMethod === STAKE_METHOD.ACCOUNT && continueClicked == true ? (
        <StakeToAccountInput
          account={account}
          status={status}
          value={stakeToAccount}
          onChange={handleAccountIdChange}
          t={t}
        />
      ) : null}
      {/* </div> */}

      {/* `Receive rewards` checkbox */}
      {/* <DeclineRewardsCheckBox isChecked={declineRewards} onChange={handleDeclineRewardsChange} /> */}
 
      {/* <Box style={{ borderTop: "5px solid #272727", width: "1000px", zIndex: "50" }}>
        <Box>
          <Button
            primary
            isLoading={bridgePending}
            disabled={!canNext}
            onClick={() => transitionTo("summary")}
            style={{ width: "90px" }}
          >
            <Trans i18nKey="common.continue" />
          </Button>
        </Box>
      </Box> */}
    </Box>
  );
};

export const StepStakingInfoFooter = ({
  t,
  bridgePending,
  status,
  transitionTo,
  account,
  onClose,
  continueClicked,
  setContinueClicked,
  transaction,
  parentAccount,
  optimisticOperation,
  stakeMethod
}: StepProps) => {
  const { errors } = status;

  const isTerminated = account && account.currency.terminated;
  const hasFieldError = Object.keys(errors).some(name => name === "stakeInput");

  const canNext = !bridgePending && !hasFieldError && !isTerminated;

  return (
    continueClicked === false ? 
    <Box style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", marginLeft: "0px", width: "100%", }}>
      <Button outline mr={1} secondary onClick={onClose}>
        <Trans i18nKey="common.cancel" />
      </Button>
      <Button
        primary
        isLoading={bridgePending}
        onClick={() => {
          setContinueClicked(true);
        }
        }
      >
        <Trans i18nKey="common.continue" />
      </Button>
    </Box>
    : continueClicked === true && stakeMethod === STAKE_METHOD.ACCOUNT ? 
    <Box style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", marginLeft: "0px", width: "100%", }}>
      <Button outline mr={1} secondary onClick={onClose}>
        <Trans i18nKey="common.cancel" />
      </Button>
      <Button
        primary
        isLoading={bridgePending}
        onClick={() => transitionTo("summary")}
      >
        <Trans i18nKey="common.continue" />
      </Button>
    </Box>
    : null
    
    // <Button
    //   primary
    //   isLoading={bridgePending}
    //   disabled={!canNext}
    //   onClick={() => transitionTo("summary")}
    // >
    //   <Trans i18nKey="common.continue" />
    // </Button>
  );
};

export default StepStakingInfo