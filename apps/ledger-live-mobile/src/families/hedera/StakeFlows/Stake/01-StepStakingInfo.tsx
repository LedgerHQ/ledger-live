import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import invariant from "invariant";
import { Text } from "@ledgerhq/native-ui";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { capitalize } from "@ledgerhq/live-common/families/hedera/utils";
import { getNodeList } from "@ledgerhq/live-common/families/hedera/api/mirror";
import {
  HederaAccount,
  STAKE_METHOD,
  STAKE_TYPE,
} from "@ledgerhq/live-common/families/hedera/types";

import type { StakeMethod } from "@ledgerhq/live-common/families/hedera/types";
import { ScreenName } from "../../../../const";
import { accountScreenSelector } from "../../../../reducers/accounts";

import Button from "../../../../components/Button";
import TranslatedError from "../../../../components/TranslatedError";
import StakeMethodSelect from "../components/StakeMethodSelect";
import StakeToAccountInput from "../components/StakeToAccountInput";
import StakeToNodeSelect from "../components/StakeToNodeSelect";
import DeclineRewardsCheckBox from "../components/DeclineRewardsCheckBox";

import type { HederaStakeFlowParamList, Node, NodeList } from "../types";
import { StackNavigatorProps } from "../../../../components/RootNavigator/types/helpers";

// type RouteParams = {
//   transaction: Transaction;
//   stakeType: StakeType;
// };

// type Props = {
//   navigation: any;
//   route: {
//     params: RouteParams;
//   };
// };

type Props = StackNavigatorProps<
  HederaStakeFlowParamList,
  ScreenName.HederaStakeInfo
>;

function StepStakingInfo({ navigation, route }: Props) {
  const {
    params: { stakeType },
  } = route;
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));
  const hederaAccount = account as HederaAccount;
  invariant(account, "account required");
  const mainAccount = getMainAccount(account, undefined);
  const bridge = getAccountBridge(account, undefined);

  const { transaction, status, updateTransaction } = useBridgeTransaction(
    () => {
      const t = bridge.createTransaction(mainAccount);

      let transaction = bridge.updateTransaction(t, {
        mode: "stake",
        staked: { ...t.staked, stakeMethod: STAKE_METHOD.NODE, stakeType },
      });

      // account should have staking info in its `hederaResources`; set and update into `transaction`
      if (stakeType === STAKE_TYPE.CHANGE) {
        transaction = bridge.updateTransaction(transaction, {
          staked: {
            ...transaction.staked,
            ...hederaAccount.hederaResources.staked,
          },
        });
      }

      return {
        transaction,
      };
    },
  );

  // check if there are any errors in `status`
  const error =
    status.errors &&
    Object.keys(status.errors).length > 0 &&
    Object.values(status.errors)[0];

  // fetch list of stake-able nodes
  const [loadingNodeList, setLoadingNodeList] = useState(true); // pre-emptively start loading indicator, so it won't flash the `StakeToNodeSelect` component
  const [nodeList, setNodeList] = useState<NodeList>([]);
  useEffect(() => {
    const fetchNodeList = async () => {
      setLoadingNodeList(true);

      try {
        const nodeList = (await getNodeList()).map(node => ({
          label: node.node_account_id,
          value: node.node_id,
          data: node.node_id,
        }));

        setNodeList(nodeList);
      } finally {
        setLoadingNodeList(false);
      }
    };

    fetchNodeList();
  }, [navigation, route]); // pass through props as dependencies so that `useEffect` will run once (or as few times as possible)

  const stakeMethods = [
    {
      label: capitalize(STAKE_METHOD.NODE),
      value: STAKE_METHOD.NODE,
    },
    {
      label: capitalize(STAKE_METHOD.ACCOUNT),
      value: STAKE_METHOD.ACCOUNT,
    },
  ];

  // TODO: maybe strange warning (w/ the AlgorandTx) is because of wrong import source?
  const [stakeMethod, setStakeMethod] = useState(
    transaction?.staked?.stakeMethod ?? STAKE_METHOD.NODE,
  );
  const [stakeToAccount, setStakeToAccount] = useState(
    transaction?.staked?.accountId ?? "",
  );
  const [stakeToNode, setStakeToNode] = useState(
    transaction?.staked?.nodeId ?? null,
  );
  const [declineRewards, setDeclineRewards] = useState(
    transaction?.staked?.declineRewards ?? false,
  );

  // TODO: think of whether it's worth making a fnc
  // that uses `switch` and filters via `type` param
  // for the bottom three or so functions (fnc body are all _very_ similar)
  const handleAccountIdChange = (accountId: string) => {
    setStakeToAccount(accountId);

    invariant(transaction, "transaction required");
    updateTransaction(() =>
      bridge.updateTransaction(transaction, {
        staked: {
          ...transaction.staked,

          accountId,
          stakeMethod: STAKE_METHOD.ACCOUNT,
        },
      }),
    );
  };

  const handleNodeIdChange = (node: Node) => {
    const nodeId = node.value;
    setStakeToNode(nodeId);

    invariant(transaction, "transaction required");
    updateTransaction(() =>
      bridge.updateTransaction(transaction, {
        staked: {
          ...transaction.staked,

          nodeId,
          stakeMethod: STAKE_METHOD.NODE,
        },
      }),
    );
  };

  const handleDeclineRewardsChange = (result: boolean) => {
    setDeclineRewards(result);

    invariant(transaction, "transaction required");
    updateTransaction(() =>
      bridge.updateTransaction(transaction, {
        staked: {
          ...transaction.staked,

          declineRewards: result,
        },
      }),
    );
  };

  const handleStakeMethodChange = (stakeMethod: StakeMethod | string) => {
    // need to update bridge `transaction` to trigger for `status` errors
    clearOtherStakeMethod(stakeMethod);
  };

  /**
   * If @param stakeMethod is `StakeMethod.NODE`, clear account id input on UI and bridge `transaction`
   * If @param stakeMethod is `StakeMethod.ACCOUNT`, clear node id input on UI and bridge `transaction`
   */
  const clearOtherStakeMethod = (stakeMethod: StakeMethod | string) => {
    invariant(transaction, "transaction required");

    setStakeMethod(stakeMethod);

    if (stakeMethod === STAKE_METHOD.NODE) {
      setStakeToAccount("");

      updateTransaction(() =>
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

      updateTransaction(() =>
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

  const onNext = () => {
    navigation.navigate(ScreenName.HederaStakeSummary, {
      account: hederaAccount,
      transaction,
    });
  };

  return (
    <View style={styles.container}>
      {/* stake method selector */}
      <StakeMethodSelect
        value={stakeMethod}
        options={stakeMethods}
        onChange={handleStakeMethodChange}
      />

      <View style={styles.methodInputWrapper}>
        {/* stake to node */}
        {stakeMethod === STAKE_METHOD.NODE ? (
          loadingNodeList ? (
            <View style={styles.loadingNodeListContainer}>
              <Text>
                <Trans i18nKey="hedera.stake.flow.stake.nodeList.loading" />
              </Text>
            </View>
          ) : (
            <StakeToNodeSelect
              selected={stakeToNode}
              nodeList={nodeList}
              onChange={handleNodeIdChange}
              navigation={navigation}
            />
          )
        ) : null}

        {/* stake to account */}
        {stakeMethod === STAKE_METHOD.ACCOUNT ? (
          <StakeToAccountInput
            value={stakeToAccount}
            onChange={handleAccountIdChange}
          />
        ) : null}
      </View>

      {/* separator */}
      <View style={styles.separatorContainer}>
        <View
          style={[
            styles.separatorLine,
            {
              borderBottomColor: colors.lightFog,
            },
          ]}
        />
      </View>

      {/* `Receive rewards` checkbox */}
      <DeclineRewardsCheckBox
        isChecked={declineRewards}
        onChange={handleDeclineRewardsChange}
      />

      {/* Continue button */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <View style={styles.warningSection}>
          {error && error instanceof Error ? (
            <Text selectable style={styles.warning} color="alert">
              <TranslatedError error={error} />
            </Text>
          ) : null}
        </View>
        <Button
          disabled={error instanceof Error}
          event="Hedera StepStakingInfoContinueBtn"
          onPress={onNext}
          title={<Trans i18nKey="hedera.common.continue" />}
          type="primary"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
    marginTop: 32,
    marginHorizontal: 16,
  },
  methodInputWrapper: {
    marginBottom: 48,
  },
  separatorContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  separatorLine: {
    flex: 1,
    borderBottomWidth: 1,
    marginBottom: 32,
  },
  footer: {
    width: "100%",
    marginTop: 32,
  },
  warningSection: {
    padding: 16,
    height: 80,
  },
  warning: {
    textAlign: "center",
  },
  loadingNodeListContainer: {
    height: 48,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default StepStakingInfo;
