import {
  getMainAccount,
} from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useValidatorGroups } from "@ledgerhq/live-common/families/celo/react";
import {
  CeloValidatorGroup,
  Transaction,
} from "@ledgerhq/live-common/families/celo/types";
import { activatableVotes } from "@ledgerhq/live-common/families/celo/logic";
import { Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import invariant from "invariant";
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { Trans } from "react-i18next";
import {  SafeAreaView, StyleSheet, View } from "react-native";
import Icon from "react-native-vector-icons/dist/Feather";
import { useSelector } from "react-redux";
import { TrackScreen } from "../../../analytics";
import { rgba } from "../../../colors";
import Button from "../../../components/Button";
import Touchable from "../../../components/Touchable";
import { ScreenName } from "../../../const";
import { accountScreenSelector } from "../../../reducers/accounts";
import { CeloAccount } from "@ledgerhq/live-common/lib/families/celo/types";

type Props = {
  navigation: any;
  route: { params: RouteParams };
};

type RouteParams = {
  validator: CeloValidatorGroup;
  transaction?: Transaction;
  fromSelectAmount: boolean;
};

export default function ActivateSummary({ navigation, route }: Props) {
  const { validator } = route.params;
  const { colors } = useTheme();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));

  invariant(account, "account must be defined");

  const validators = useValidatorGroups();
  const votes = activatableVotes(account as CeloAccount);
  const mainAccount = getMainAccount(account, parentAccount);
  const bridge = getAccountBridge(account, undefined);

  const chosenValidator = useMemo(() => {
    if (validator !== undefined) {
      return validator;
    }

    if(votes.length) {
      return validators.find(v => v.address === votes[0].validatorGroup);
    }

    return undefined;
  }, [votes, validator, validators]);

  const {
    transaction,
    updateTransaction,
    setTransaction,
    status,
    bridgePending,
    bridgeError,
  } = useBridgeTransaction(() => {
    const tx = route.params.transaction;

    if (!tx) {
      const t = bridge.createTransaction(mainAccount);

      return {
        account,
        transaction: bridge.updateTransaction(t, {
          mode: "activate",
        }),
      };
    }

    return { account, transaction: tx };
  });

  invariant(transaction, "transaction must be defined");
  invariant(transaction.family === "celo", "transaction celo");

  useEffect(() => {
    setTransaction(
      bridge.updateTransaction(transaction, {
        recipient: chosenValidator?.address ?? "",
      }),
    );
  }, [
    updateTransaction,
    bridge,
    setTransaction,
    chosenValidator,
  ]);

  const onChangeDelegator = useCallback(() => {
    navigation.navigate(ScreenName.CeloActivateValidatorSelect, {
      ...route.params,
      transaction,
    });
  }, [navigation, transaction, route.params]);

  const onContinue = useCallback(async () => {
    navigation.navigate(ScreenName.CeloActivateSelectDevice, {
      accountId: account.id,
      parentId: parentAccount && parentAccount.id,
      transaction,
      status,
    });
  }, [status, account, parentAccount, navigation, transaction]);

  const hasErrors = Object.keys(status.errors).length > 0;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen category="ActivateFlow" name="Summary" />

      <View style={styles.body}>
        <View style={styles.summary}>
          <SummaryWords
            onChangeValidator={onChangeDelegator}
            validator={chosenValidator}
          />
        </View>
      </View>
      <View style={styles.footer}>
        <Button
          event="SummaryContinue"
          type="primary"
          title={<Trans i18nKey="common.continue" />}
          containerStyle={styles.continueButton}
          onPress={onContinue}
          disabled={bridgePending || !!bridgeError || hasErrors}
          pending={bridgePending}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "column",
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: "space-around",
  },
  summary: {
    alignItems: "center",
    marginVertical: 30,
  },
  summaryLine: {
    marginVertical: 10,
    flexDirection: "row",
    height: 40,
    alignItems: "center",
  },
  summaryWords: {
    marginRight: 6,
    fontSize: 18,
  },
  validatorSelection: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 4,
    height: 40,
  },
  validatorSelectionText: {
    paddingHorizontal: 8,
    fontSize: 18,
    maxWidth: 240,
  },
  validatorSelectionIcon: {
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 40,
  },
  footer: {
    flexDirection: "column",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  continueButton: {
    alignSelf: "stretch",
    marginTop: 12,
  },
});

function SummaryWords({
  validator,
  onChangeValidator,
}: {
  validator?: CeloValidatorGroup;
  onChangeValidator: () => void;
}) {
  return (
    <>
      <Line>
        <Words>
          <Trans i18nKey={`celo.activate.iActivate`} />
        </Words>
      </Line>
      <Line>
        <Words>
          <Trans i18nKey="delegation.to" />
        </Words>
        <Touchable onPress={onChangeValidator}>
          <Selectable name={validator?.name ?? validator?.address ?? "-"} />
        </Touchable>
      </Line>
    </>
  );
}

const Line = ({ children }: { children: ReactNode }) => (
  <View style={styles.summaryLine}>{children}</View>
);

const Words = ({
  children,
  highlighted,
  style,
}: {
  children: ReactNode;
  highlighted?: boolean;
  style?: any;
}) => (
  <Text
    numberOfLines={1}
    fontWeight={highlighted ? "bold" : "semiBold"}
    style={[styles.summaryWords, style]}
    color={highlighted ? "live" : "smoke"}
  >
    {children}
  </Text>
);

const Selectable = ({
  name,
  readOnly,
}: {
  name: string;
  readOnly?: boolean;
}) => {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.validatorSelection,
        { backgroundColor: rgba(colors.primary, 0.2) },
      ]}
    >
      <Text
        fontWeight="bold"
        numberOfLines={1}
        style={styles.validatorSelectionText}
        color={colors.primary}
      >
        {name}
      </Text>

      <View
        style={[
          styles.validatorSelectionIcon,
          { backgroundColor: colors.primary },
        ]}
      >
        <Icon size={16} name="edit-2" color={colors.text} />
      </View>
    </View>
  );
};
