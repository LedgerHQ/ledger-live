// @flow
import React, { memo, useCallback, useState, useMemo, useRef } from "react";
import {
  View,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
} from "react-native";
import { Trans } from "react-i18next";
import type { Vote } from "@ledgerhq/live-common/lib/families/tron/types";

import { Switch } from "react-native-gesture-handler";
import BottomModal from "../../../components/BottomModal";
import Button from "../../../components/Button";
import colors from "../../../colors";
import LText from "../../../components/LText";
import Close from "../../../icons/Close";
import Trash from "../../../icons/Trash";
import Check from "../../../icons/Check";

type Props = {
  vote: Vote,
  name: string,
  tronPower: number,
  onChange: (vote: Vote) => void,
  onRemove: (vote: Vote) => void,
  onClose: () => void,
  votes: Vote[],
};

const VoteModal = ({
  vote,
  name,
  tronPower,
  onChange,
  onClose,
  onRemove,
  votes,
}: Props) => {
  const { address, voteCount } = vote || {};

  const [value, setValue] = useState(voteCount);

  const [useAllAmount, setUseAllAmount] = useState(false);

  const { current: votesAvailable } = useRef(
    tronPower -
      votes
        .filter(v => v.address !== address)
        .reduce((sum, { voteCount }) => sum + voteCount, 0),
  );

  const handleChange = useCallback(
    text => {
      setValue(parseInt(text || "0", 10));
      setUseAllAmount(false);
    },
    [setValue],
  );

  const toggleUseAllAmount = useCallback(() => {
    handleChange(!useAllAmount ? votesAvailable : 0);
    setUseAllAmount(!useAllAmount);
  }, [handleChange, useAllAmount, votesAvailable]);

  const onContinue = useCallback(
    () => onChange({ address, voteCount: value }),
    [address, onChange, value],
  );

  const remove = useCallback(() => onRemove(vote), [onRemove, vote]);

  const votesRemaining = useMemo(() => Math.max(0, votesAvailable - value), [
    value,
    votesAvailable,
  ]);

  const error = value <= 0 || value > votesAvailable;

  return (
    <BottomModal isOpened={!!vote} onClose={onClose}>
      <SafeAreaView style={styles.root}>
        <KeyboardAvoidingView
          style={styles.rootKeyboard}
          behavior="padding"
          enabled
        >
          <View style={styles.topContainer}>
            <TouchableOpacity style={styles.topButton} onPress={remove}>
              <Trash size={16} color={colors.grey} />
            </TouchableOpacity>

            <View style={styles.topLabel}>
              <LText style={styles.topSubTitle}>
                <Trans i18nKey="vote.castVotes.voteFor" />
              </LText>
              <LText semiBold style={styles.topTitle}>
                {name || address}
              </LText>
            </View>

            <TouchableOpacity style={styles.topButton} onPress={onClose}>
              <Close size={16} color={colors.grey} />
            </TouchableOpacity>
          </View>
          <View style={styles.wrapper}>
            <TextInput
              allowFontScaling={false}
              hitSlop={{ top: 20, bottom: 20 }}
              onChangeText={handleChange}
              style={[styles.inputStyle, error ? styles.error : {}]}
              autoCorrect={false}
              value={`${value || ""}`}
              autoFocus
              keyboardType="numeric"
              blurOnSubmit
              placeholder="0"
            />
          </View>
          <View style={styles.bottomWrapper}>
            <View style={[styles.availableRow, styles.row]}>
              <View style={styles.available}>
                {error && value <= 0 ? (
                  <LText style={[styles.availableAmount, styles.error]}>
                    <Trans i18nKey="vote.castVotes.votesRequired" />
                  </LText>
                ) : null}
                {error ? (
                  <LText
                    style={[
                      styles.availableAmount,
                      error
                        ? styles.error
                        : votesRemaining === 0
                        ? styles.availableSuccess
                        : {},
                    ]}
                  >
                    <Trans
                      i18nKey="vote.castVotes.maxVotesAvailable"
                      values={{ total: votesAvailable }}
                    >
                      <LText
                        semiBold
                        style={[styles.availableAmount, styles.error]}
                      >
                        text
                      </LText>
                    </Trans>
                  </LText>
                ) : votesRemaining === 0 ? (
                  <View style={styles.row}>
                    <Check size={16} color={colors.success} />
                    <LText
                      style={[styles.availableAmount, styles.availableSuccess]}
                    >
                      <Trans i18nKey="vote.castVotes.allVotesUsed" />
                    </LText>
                  </View>
                ) : (
                  <LText style={styles.availableAmount}>
                    <Trans
                      i18nKey="vote.castVotes.votesRemaining"
                      values={{ total: votesRemaining }}
                    >
                      <LText
                        semiBold
                        style={[styles.availableAmount, styles.regularText]}
                      >
                        text
                      </LText>
                    </Trans>
                  </LText>
                )}
              </View>
              <View style={styles.availableRight}>
                <LText style={styles.maxLabel}>
                  <Trans i18nKey="send.amount.useMax" />
                </LText>
                <Switch
                  style={styles.switch}
                  value={useAllAmount}
                  onValueChange={toggleUseAllAmount}
                />
              </View>
            </View>
            <View style={styles.continueWrapper}>
              <Button
                type="primary"
                event="TronValidateVote"
                title={<Trans i18nKey="vote.castVotes.validateVotes" />}
                onPress={onContinue}
                disabled={!!error}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </BottomModal>
  );
};

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
  },
  rootKeyboard: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    height: "auto",
  },
  topButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  topContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  topLabel: {
    flex: 1,
    paddingTop: 16,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  topSubTitle: {
    fontSize: 13,
    color: colors.grey,
  },
  topTitle: {
    fontSize: 15,
    color: colors.darkBlue,
  },
  bottomWrapper: {
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.lightGrey,
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
  container: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 16,
    alignItems: "stretch",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "nowrap",
  },
  availableRow: {
    width: "100%",
  },
  available: {
    flex: 1,
    flexDirection: "column",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "flex-end",
    fontSize: 16,
    paddingVertical: 8,
    color: colors.grey,
    marginBottom: 8,
    height: 50,
  },
  availableRight: {
    alignItems: "center",
    justifyContent: "flex-end",
    flexDirection: "row",
  },
  availableAmount: {
    color: colors.grey,
    marginHorizontal: 3,
  },
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    flexBasis: 200,
    flexGrow: 1,
  },
  inputStyle: {
    flex: 1,
    fontFamily: "Rubik",
    textAlign: "center",
    color: colors.darkBlue,
    fontSize: 32,
  },
  error: { color: colors.alert },
  regularText: { color: colors.darkBlue },
  continueButton: {
    alignContent: "center",
    justifyContent: "center",
    backgroundColor: colors.live,
    height: 48,
    paddingHorizontal: 10,
    borderRadius: 4,
    overflow: "hidden",
  },
  disabledButton: {
    backgroundColor: colors.lightFog,
  },
  buttonText: {
    fontSize: 16,
    color: colors.white,
    textAlign: "center",
  },
  disabledButtonText: {
    color: colors.grey,
  },
  maxLabel: {
    color: colors.grey,
    marginRight: 4,
  },
  switch: {
    opacity: 0.99,
  },
  availableSuccess: { color: colors.success, marginLeft: 10 },
});

export default memo<Props>(VoteModal);
