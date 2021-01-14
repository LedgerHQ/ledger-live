// @flow
import React, { memo, useCallback, useState, useMemo, useRef } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  SafeAreaView,
  Platform,
} from "react-native";
import { Trans } from "react-i18next";
import type { Vote } from "@ledgerhq/live-common/lib/families/tron/types";

import { useTheme } from "@react-navigation/native";
import Switch from "../../../components/Switch";
import BottomModal from "../../../components/BottomModal";
import Button from "../../../components/Button";
import LText from "../../../components/LText";
import Close from "../../../icons/Close";
import Trash from "../../../icons/Trash";
import Check from "../../../icons/Check";

import getWindowDimensions from "../../../logic/getWindowDimensions";

const { height } = getWindowDimensions();

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
  const { colors } = useTheme();
  const { address, voteCount } = vote || {};

  const [value, setValue] = useState(voteCount);

  const [useAllAmount, setUseAllAmount] = useState(false);

  const inputRef = useRef();

  const { current: votesAvailable } = useRef(
    tronPower -
      votes
        .filter(v => v.address !== address)
        .reduce((sum, { voteCount }) => sum + voteCount, 0),
  );

  const focusInput = useCallback(() => {
    if (inputRef && inputRef.current) inputRef.current.focus();
  }, [inputRef]);

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
    <BottomModal
      isOpened={!!vote}
      onClose={onClose}
      coverScreen
      onModalShow={focusInput}
    >
      <SafeAreaView>
        <KeyboardAvoidingView
          style={styles.rootKeyboard}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={100}
          enabled
        >
          <View style={styles.topContainer}>
            <TouchableOpacity style={styles.topButton} onPress={remove}>
              <Trash size={16} color={colors.grey} />
            </TouchableOpacity>

            <View style={styles.topLabel}>
              <LText style={styles.topSubTitle} color="grey">
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
              ref={inputRef}
              allowFontScaling={false}
              hitSlop={{ top: 20, bottom: 20 }}
              onChangeText={handleChange}
              style={[
                styles.inputStyle,
                error ? { color: colors.alert } : { color: colors.darkBlue },
              ]}
              autoCorrect={false}
              value={`${value || ""}`}
              keyboardType="numeric"
              blurOnSubmit
              placeholder="0"
            />
          </View>
          <View
            style={[styles.bottomWrapper, { borderTopColor: colors.lightGrey }]}
          >
            <View style={[styles.availableRow, styles.row]}>
              <View style={styles.available}>
                {error && value <= 0 ? (
                  <LText
                    style={[styles.availableAmount, { color: colors.alert }]}
                  >
                    <Trans i18nKey="vote.castVotes.votesRequired" />
                  </LText>
                ) : null}
                {error ? (
                  <LText
                    style={[
                      styles.availableAmount,
                      error
                        ? { color: colors.alert }
                        : votesRemaining === 0
                        ? { ...styles.availableSuccess, color: colors.success }
                        : {},
                    ]}
                  >
                    <Trans
                      i18nKey="vote.castVotes.maxVotesAvailable"
                      values={{ total: votesAvailable }}
                    >
                      <LText
                        semiBold
                        style={[
                          styles.availableAmount,
                          { color: colors.alert },
                        ]}
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
                      color="success"
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
                      <LText semiBold style={[styles.availableAmount]}>
                        text
                      </LText>
                    </Trans>
                  </LText>
                )}
              </View>
              <View style={styles.availableRight}>
                <LText style={styles.maxLabel} color="grey">
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
  rootKeyboard: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-end",
    height: height - 100,
    flexShrink: 1,
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
    flexBasis: 50,
    flexShrink: 0,
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
  },
  topTitle: {
    fontSize: 15,
  },
  bottomWrapper: {
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
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
    marginBottom: 8,
    height: 50,
  },
  availableRight: {
    alignItems: "center",
    justifyContent: "flex-end",
    flexDirection: "row",
  },
  availableAmount: {
    marginHorizontal: 3,
  },
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    flexGrow: 1,
    flexShrink: 1,
  },
  inputStyle: {
    flex: 1,
    fontFamily: "Inter",
    textAlign: "center",

    fontSize: 32,
  },
  maxLabel: {
    marginRight: 4,
  },
  switch: {
    opacity: 0.99,
  },
  availableSuccess: { marginLeft: 10 },
});

export default memo<Props>(VoteModal);
