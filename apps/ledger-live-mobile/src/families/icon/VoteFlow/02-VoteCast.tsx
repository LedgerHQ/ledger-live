import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { IconAccount } from "@ledgerhq/live-common/families/icon/types";
import {
  formatVotes, SR_MAX_VOTES, useIconPublicRepresentatives
} from "@ledgerhq/live-common/families/icon/react";
import type {
  Transaction, Vote
} from "@ledgerhq/live-common/families/icon/types";
import { useTheme } from "@react-navigation/native";
import invariant from "invariant";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Trans } from "react-i18next";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { TrackScreen } from "../../../analytics";
import Button from "../../../components/Button";
import CancelButton from "../../../components/CancelButton";
import GenericErrorBottomModal from "../../../components/GenericErrorBottomModal";
import LText from "../../../components/LText";
import RetryButton from "../../../components/RetryButton";
import { StackNavigatorProps } from "../../../components/RootNavigator/types/helpers";
import { ScreenName } from "../../../const";
import ArrowRight from "../../../icons/ArrowRight";
import Check from "../../../icons/Check";
import { accountScreenSelector } from "../../../reducers/accounts";
import VoteModal from "./02-VoteModal";
import VoteRow from "./02-VoteRow";
import { IconVoteFlowParamList } from "./types";

type Props = StackNavigatorProps<IconVoteFlowParamList, ScreenName.IconVoteCast>;

export default function IconVoteCast({ route, navigation }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));
  invariant(account, "account is required");
  invariant(account.type === "Account", "account must be a main Account");
  const bridge = getAccountBridge<Transaction>(account, undefined);
  const { iconResources } = account as IconAccount;
  invariant(iconResources, "Icon resources required");
  const { votingPower, totalDelegated } = iconResources;
  const { transaction, status, setTransaction, bridgeError, bridgePending } =
    useBridgeTransaction<Transaction>(() => {
      const tx = route.params.transaction;

      if (!tx) {
        const t = bridge.createTransaction(account);
        const { votes } = iconResources;
        return {
          account,
          transaction: bridge.updateTransaction(t, {
            mode: "vote",
            votes: votes || [],
          }),
        };
      }

      return {
        account,
        transaction: tx,
      };
    });
  invariant(transaction, "transaction must be defined");
  invariant(transaction.family === "icon", "transaction icon");
  const { votes } = transaction;
  const sp = useIconPublicRepresentatives(account.currency);
  const formattedVotes = useMemo(() => formatVotes(votes, sp), [sp, votes]);
  const votesRemaining = useMemo(
    () => Number(votingPower) - votes.reduce((sum, { value }) => sum + Number(value), 0),
    [votingPower, votes],
  );
  const [editVote, setEditVote] = useState<{
    vote: Vote;
    name: string;
  } | null>();
  const closeEditVote = useCallback(() => setEditVote(null), [setEditVote]);
  const onChange = useCallback(
    (vote: Vote) => {
      const nextVotes = [...votes];
      const index = votes.findIndex(v => v.address === vote.address);
      if (index >= 0) nextVotes[index] = vote;
      else if (nextVotes.length < 5) nextVotes.push(vote);
      setTransaction(
        bridge.updateTransaction(transaction, {
          votes: nextVotes,
        }),
      );
      closeEditVote();
    },
    [votes, setTransaction, bridge, transaction, closeEditVote],
  );
  const openEditModal = useCallback(
    (vote: Vote, name: string) => {
      setEditVote({
        vote,
        name,
      });
      setopenIndex(-1);
    },
    [setEditVote],
  );
  const [openIndex, setopenIndex] = useState(-1);
  const onOpen = useCallback(
    i => {
      setopenIndex(i);
    },
    [setopenIndex],
  );
  const onRemove = useCallback(
    (vote: Vote) => {
      setTransaction(
        bridge.updateTransaction(transaction, {
          votes: votes.filter(v => v.address !== vote.address),
        }),
      );
      closeEditVote();
    },
    [votes, setTransaction, bridge, transaction, closeEditVote],
  );
  const onBack = useCallback(() => {
    navigation.push(ScreenName.IconVoteSelectValidator, {
      accountId: account.id,
      transaction,
      status,
      fromStep2: true,
    });
  }, [account, navigation, transaction, status]);
  const onContinue = useCallback(() => {
    navigation.navigate(ScreenName.IconVoteSelectDevice, {
      accountId: account.id,
      transaction,
      status,
    });
  }, [account, navigation, transaction, status]);
  const [bridgeErr, setBridgeErr] = useState(bridgeError);
  useEffect(() => setBridgeErr(bridgeError), [bridgeError]);
  const onBridgeErrorCancel = useCallback(() => {
    setBridgeErr(null);
    const parent = navigation.getParent();
    if (parent) parent.goBack();
  }, [navigation]);
  const onBridgeErrorRetry = useCallback(() => {
    setBridgeErr(null);
    if (!transaction) return;
    setTransaction(bridge.updateTransaction(transaction, {}));
  }, [setTransaction, transaction, bridge]);
  const error = bridgePending ? null : status.errors.vote;
  return (
    <>
      <TrackScreen category="Vote" name="VoteCast" />
      <SafeAreaView
        style={[
          styles.root,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <ScrollView style={[styles.root]}>
          {formattedVotes.map((vote, i) => (
            <VoteRow
              key={vote.address || '' + i}
              vote={vote}
              onEdit={openEditModal}
              onRemove={onRemove}
              onOpen={onOpen}
              openIndex={openIndex}
              index={i}
            />
          ))}
          {votes.length < SR_MAX_VOTES ? (
            <View style={styles.addMoreVotesContainer}>
              <TouchableOpacity
                onPress={onBack}
                style={[
                  styles.addMoreVotes,
                  {
                    backgroundColor: colors.card,
                  },
                ]}
              >
                <LText semiBold style={styles.addMoreVotesLabel} color="live">
                  <Trans i18nKey="vote.castVotes.addMoreVotes" />
                </LText>
                <ArrowRight size={16} color={colors.live} />
              </TouchableOpacity>
            </View>
          ) : null}
        </ScrollView>
        <View
          style={[
            styles.bottomWrapper,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.lightGrey,
            },
          ]}
        >
          <View style={[styles.available]}>
            {votesRemaining <= 0 ? (
              <>
                <Check size={16} color={colors.success} />
                <LText
                  semiBold
                  style={[styles.availableAmount, styles.votesSuccess]}
                  color="success"
                >
                  <Trans i18nKey="vote.castVotes.allVotesUsed" />
                </LText>
              </>
            ) : (
              <LText style={styles.availableAmount} color="grey">
                <Trans
                  i18nKey="vote.castVotes.votesRemaining"
                  values={{
                    total: votesRemaining,
                  }}
                >
                  <LText semiBold style={styles.availableAmount}>
                    text
                  </LText>
                </Trans>
              </LText>
            )}
          </View>
          <View style={styles.continueWrapper}>
            <Button
              event="VoteCastContinue"
              type="primary"
              title={<Trans i18nKey="common.continue" />}
              onPress={onContinue}
              disabled={!!error}
              pending={bridgePending}
            />
          </View>
        </View>
      </SafeAreaView>
      {editVote ? (
        <VoteModal
          vote={editVote.vote}
          name={editVote.name}
          votingPower={votingPower}
          totalDelegated={totalDelegated}
          votes={votes}
          onChange={onChange}
          onRemove={onRemove}
          onClose={closeEditVote}
        />
      ) : null}

      <GenericErrorBottomModal
        error={bridgeErr}
        onClose={onBridgeErrorRetry}
        footerButtons={
          <>
            <CancelButton
              containerStyle={styles.button}
              onPress={onBridgeErrorCancel}
            />
            <RetryButton
              containerStyle={[styles.button, styles.buttonRight]}
              onPress={onBridgeErrorRetry}
            />
          </>
        }
      />
    </>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topContainer: {
    paddingHorizontal: 32,
  },
  bottomWrapper: {
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
  buttonRight: {
    marginLeft: 8,
  },
  continueWrapper: {
    alignSelf: "stretch",
    alignItems: "stretch",
    justifyContent: "flex-end",
  },
  available: {
    flexDirection: "row",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
    paddingVertical: 8,
    marginBottom: 8,
  },
  availableAmount: {
    marginHorizontal: 3,
  },
  addMoreVotesContainer: {
    paddingHorizontal: 16,
  },
  addMoreVotes: {
    width: "100%",
    padding: 16,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 5,
  },
  addMoreVotesLabel: {
    fontSize: 16,
  },
  votesSuccess: {
    marginLeft: 10,
  },
});
