import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import invariant from "invariant";
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
import { Flex, Icons } from "@ledgerhq/native-ui";
import {
  ExternalLinkMedium,
  PlusMedium,
} from "@ledgerhq/native-ui/assets/icons";
import { ScreenName } from "../../../../const";
import { accountScreenSelector } from "../../../../reducers/accounts";

import Button from "../../../../components/Button";
import StakeMethodSelect from "../components/StakeMethodSelect";
import StakeToAccountInput from "../components/StakeToAccountInput";
import StakeToNodeSelect from "../components/StakeToNodeSelect";

import type { HederaStakeFlowParamList, Node, NodeList } from "../types";
import { StackNavigatorProps } from "../../../../components/RootNavigator/types/helpers";
import Link from "../../../../components/wrappedUi/Link";

type Props = StackNavigatorProps<
  HederaStakeFlowParamList,
  ScreenName.HederaStakingType
>;

function StepStakingType({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));
  const hederaAccount = account as HederaAccount;
  invariant(account, "account required");
  const mainAccount = getMainAccount(account, undefined);
  const bridge = getAccountBridge(account, undefined);

  const { transaction, status, updateTransaction } = useBridgeTransaction(
    () => {
      const t = bridge.createTransaction(mainAccount);

      const transaction = bridge.updateTransaction(t, {
        mode: "stake",
        staked: {
          ...t.staked,
          stakeMethod: STAKE_METHOD.NODE,
          stakeType: STAKE_TYPE.NEW,
        },
      });

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

  const [currentScreen, setCurrentScreen] = useState("started");

  const [validation, setValidation] = useState(false);

  const [nodeList, setNodeList] = useState<NodeList>([]);

  useEffect(() => {
    const fetchNodeList = async () => {
      try {
        const nodeList = (await getNodeList()).map(node => ({
          description: node.description,
          label: node.node_account_id,
          value: node.node_id,
          stake: node.stake,
          rewarding: node.stake > node.min_stake,
        }));

        setNodeList(nodeList);
      } catch {
        // eslint-disable-next-line no-console
        console.log("nodes not loaded");
      }
    };

    fetchNodeList();
  }, [navigation, route]); // pass through props as dependencies so that `useEffect` will run once (or as few times as possible)

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

  // TODO: maybe strange warning (w/ the AlgorandTx) is because of wrong import source?
  const [stakeMethod, setStakeMethod] = useState(
    transaction?.staked?.stakeMethod ?? STAKE_METHOD.NODE,
  );
  const [stakeToAccount, setStakeToAccount] = useState(
    transaction?.staked?.accountId ?? "",
  );

  const handleAccountIdChange = (accountId: string) => {
    setStakeToAccount(accountId);
    const accountIdValidator = new RegExp("[0-9]+.[0-9]+.[0-9]+");
    setValidation(accountIdValidator.test(accountId));
    if (validation) {
      invariant(transaction, "transaction required");
      updateTransaction(stakeToAccount =>
        bridge.updateTransaction(transaction, {
          staked: {
            ...transaction.staked,

            accountId: stakeToAccount,
            stakeMethod: STAKE_METHOD.ACCOUNT,
          },
        }),
      );
    }
  };

  const handleAccountIdNext = () => {
    invariant(transaction, "transaction required");

    navigation.navigate(ScreenName.HederaStakeSummary, {
      ...route.params,
      account: hederaAccount,
      transaction,
      accountId: stakeToAccount as string,
      nodeId: "",
      nodeList,
    });
  };

  const handleNodeIdChange = (node: Node) => {
    const nodeId = node.label;

    invariant(transaction, "transaction required");

    updateTransaction(stakeToNode =>
      bridge.updateTransaction(transaction, {
        staked: {
          ...transaction.staked,

          nodeId: stakeToNode,
          stakeMethod: STAKE_METHOD.NODE,
        },
      }),
    );

    navigation.navigate(ScreenName.HederaStakeSummary, {
      ...route.params,
      account: hederaAccount,
      transaction,
      accountId: "",
      nodeId,
      nodeList,
    });
  };

  // FIXME: Don't know how to force this component to display
  const onBack = () => {
    setCurrentScreen("started");
  };

  const handleStakeMethodChange = async (stakeMethod: StakeMethod | string) => {
    setStakeMethod(stakeMethod);

    clearOtherStakeMethod(stakeMethod);
  };

  /**
   * If @param stakeMethod is `StakeMethod.NODE`, clear account id input on UI and bridge `transaction`
   * If @param stakeMethod is `StakeMethod.ACCOUNT`, clear node id input on UI and bridge `transaction`
   */
  const clearOtherStakeMethod = (stakeMethod: StakeMethod | string) => {
    invariant(transaction, "transaction required");

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
    if (stakeMethod === STAKE_METHOD.NODE) {
      setCurrentScreen("node");
    } else if (stakeMethod === STAKE_METHOD.ACCOUNT) {
      setCurrentScreen("account");
    }
  };

  return (
    <View style={styles.container}>
      <View>
        {currentScreen === "started" ? (
          <StakeMethodSelect
            items={stakeMethods}
            activeKey={stakeMethod}
            selectNode={() => handleStakeMethodChange(STAKE_METHOD.NODE)}
            selectAccount={() => handleStakeMethodChange(STAKE_METHOD.ACCOUNT)}
          />
        ) : null}

        {currentScreen === "node" ? (
          <StakeToNodeSelect
            onNodeSelect={handleNodeIdChange}
            nodeList={nodeList}
            onBack={onBack}
          />
        ) : null}

        {currentScreen === "account" ? (
          <StakeToAccountInput
            value={stakeToAccount}
            onChange={handleAccountIdChange}
            validation={validation}
            onNext={handleAccountIdNext}
          />
        ) : null}
      </View>
      {currentScreen === "started" ? (
        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.background,
            },
          ]}
        >
          <Button
            disabled={error instanceof Error}
            event="Hedera StepStakingStartedContinueBtn"
            onPress={onNext}
            title={<Trans i18nKey="hedera.common.continue" />}
            type="main"
          />
          <Link
            Icon={() => (
              <Flex
                flexDirection="row"
                alignItems="center"
                justifyContent="center"
              >
                <ExternalLinkMedium size={20} color="#FFFFFF" />
              </Flex>
            )}
          >
            <Trans
              style={styles.linkText}
              i18nKey="hedera.stake.flow.stake.howWorks"
            />
          </Link>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
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
    paddingBottom: 24,
    gap: 24,
    paddingHorizontal: 16,
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
  linkText: {
    fontSize: 16,
  },
});

export default StepStakingType;
