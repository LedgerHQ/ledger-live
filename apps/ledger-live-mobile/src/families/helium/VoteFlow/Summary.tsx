import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { getCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import { useVotes } from "@ledgerhq/live-common/families/helium/react";
import { Transaction } from "@ledgerhq/live-common/families/helium/types";
import { assertUnreachable } from "@ledgerhq/live-common/families/helium/utils";
import { AccountLike } from "@ledgerhq/types-live";
import { Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Trans } from "react-i18next";
import { Animated, ScrollView, StyleSheet, View } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import Icon from "react-native-vector-icons/Feather";
import { useSelector } from "react-redux";
import { TrackScreen } from "../../../analytics";
import { rgba } from "../../../colors";
import Button from "../../../components/Button";
import Touchable from "../../../components/Touchable";
import { ScreenName } from "../../../const";
import { accountScreenSelector } from "../../../reducers/accounts";
import ToggleButton from "../../../components/ToggleButton";

type Props = {
  navigation: any;
  route: { params: RouteParams };
};

type RouteParams = {
  accountId: string;
  parentId?: string;
  vote: any;
};

export default function VoteSummary({ navigation, route }: Props) {
  const { vote } = route.params;
  const { colors } = useTheme();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));

  invariant(account, "account must be defined");
  invariant(account.type === "Account", "account type must be Account");

  const votes = useVotes().filter(
    vote => vote.blocksRemaining && vote.blocksRemaining > 0,
  );

  const chosenVote = useMemo(() => {
    if (!vote) {
      return votes[0];
    }

    return vote;
  }, [votes, vote]);

  const options = useCallback(
    () => [
      {
        value: chosenVote.outcomes[0].address,
        label: chosenVote.outcomes[0].value,
      },
      {
        value: chosenVote.outcomes[1].address,
        label: chosenVote.outcomes[1].value,
      },
    ],
    [chosenVote],
  );

  const [option, setOption] = useState(chosenVote.outcomes[0].address);

  const { transaction, setTransaction, status, bridgePending, bridgeError } =
    useBridgeTransaction(() => ({
      account,
      parentAccount,
      transaction: tx({
        vote: chosenVote,
        outcomeAddress: option,
        outcomeIndex: `${options().findIndex(o => o.value === option)}`,
      }),
    }));

  useEffect(() => {
    setOption(chosenVote.outcomes[0].address);
  }, [chosenVote]);

  useEffect(() => {
    setTransaction(
      tx({
        vote: chosenVote,
        outcomeAddress: option,
        outcomeIndex: `${options().findIndex(o => o.value === option)}`,
      }),
    );
  }, [option, options, chosenVote, setTransaction]);

  invariant(transaction, "transaction must be defined");
  invariant(transaction.family === "helium", "transaction helium");

  const [rotateAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: -1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(1000),
      ]),
    ).start();
    return () => {
      rotateAnim.setValue(0);
    };
  }, [rotateAnim]);

  const onChangeHIP = useCallback(() => {
    rotateAnim.setValue(0);
    navigation.navigate(ScreenName.HeliumSelectHIP, route.params);
  }, [rotateAnim, navigation, route.params]);

  const onContinue = useCallback(async () => {
    navigation.navigate(ScreenName.HeliumVoteSelectDevice, {
      accountId: account.id,
      parentId: parentAccount && parentAccount.id,
      transaction,
      status,
    });
  }, [status, account, parentAccount, navigation, transaction]);

  const hasErrors = Object.keys(status.errors).length > 0;

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.background }]}
      forceInset={{ bottom: "always" }}
    >
      <TrackScreen category="Vote Flow" name="Summary" />

      <View style={styles.body}>
        <View style={styles.summary}>
          <SummaryWords
            onChangeHIP={onChangeHIP}
            vote={chosenVote}
            account={account}
            amount={transaction.amount.toNumber()}
          />

          <ToggleButton
            onChange={option => {
              setOption(option);
            }}
            value={option}
            options={options()}
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

function tx({
  vote,
  outcomeAddress,
  outcomeIndex,
}: {
  vote: any;
  outcomeAddress: string;
  outcomeIndex: string;
}): Transaction {
  return {
    family: "helium",
    recipient: "",
    amount: new BigNumber(1),
    model: {
      mode: "burn",
      hipID: vote.id,
      payee: outcomeAddress,
      memo: outcomeIndex,
    },
  };
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
  summaryWords: {
    marginRight: 6,
    fontSize: 18,
  },
  description: {
    marginRight: 6,
    fontSize: 14,
    textAlign: "center",
  },
  HIPSelectionContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 4,
    height: 40,
  },
  HIPSelectionText: {
    paddingHorizontal: 8,
    fontSize: 18,
    maxWidth: 240,
  },
  HIPSelectionIcon: {
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 40,
  },
  HIPSelection: {
    alignItems: "center",
    paddingBottom: 12,
    flexGrow: 1,
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
  vote,
  onChangeHIP,
}: {
  vote?: any;
  account: AccountLike;
  amount: number;
  onChangeHIP: () => void;
}) {
  return (
    <View style={[styles.HIPSelection]}>
      <Touchable style={[styles.HIPSelection]} onPress={onChangeHIP}>
        <Selectable name={vote.name ?? "-"} />
      </Touchable>
      <ScrollView>
        <Description>{vote.description}</Description>
      </ScrollView>
    </View>
  );
}

const Description = ({
  children,
  highlighted,
  style,
}: {
  children: ReactNode;
  highlighted?: boolean;
  style?: any;
}) => (
  <Text
    fontWeight={highlighted ? "bold" : "semiBold"}
    style={[styles.description, style]}
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
        styles.HIPSelectionContainer,
        { backgroundColor: rgba(colors.live, 0.2) },
      ]}
    >
      <Text
        fontWeight="bold"
        numberOfLines={1}
        style={styles.HIPSelectionText}
        color="live"
      >
        {name}
      </Text>
      {readOnly ? null : (
        <View
          style={[styles.HIPSelectionIcon, { backgroundColor: colors.live }]}
        >
          <Icon size={16} name="edit-2" color={colors.white} />
        </View>
      )}
    </View>
  );
};
