import React, { memo, useCallback, useState, useMemo, useRef } from "react";
import { View, StyleSheet, TextInput } from "react-native";
import { Trans, useTranslation } from "react-i18next";
import { Vote } from "@ledgerhq/live-common/families/icon/types";
import { useTheme } from "@react-navigation/native";
import { BottomDrawer, Flex, Link } from "@ledgerhq/native-ui";
import { TrashMedium } from "@ledgerhq/native-ui/assets/icons";
import Switch from "../../../components/Switch";
import LText from "../../../components/LText";
import Check from "../../../icons/Check";
import getFontStyle from "../../../components/LText/getFontStyle";
import KeyboardView from "../../../components/KeyboardView";

import Button from "../../../components/wrappedUi/Button";
import BigNumber from "bignumber.js";

type Props = {
  vote: Vote;
  name: string;
  votingPower: string | BigNumber;
  totalDelegated: string | BigNumber;
  onChange: (vote: Vote) => void;
  onRemove: (vote: Vote) => void;
  onClose: () => void;
  votes: Vote[];
};

const IconVoteModal = ({
  vote,
  name,
  votingPower,
  totalDelegated,
  onChange,
  onClose,
  onRemove,
  votes,
}: Props) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { address, value: voteCount } = vote || {};

  const [value, setValue] = useState(voteCount);

  const [useAllAmount, setUseAllAmount] = useState(false);

  const inputRef = useRef<TextInput>(null);

  const { current: votesAvailable } = useRef(
    Number(totalDelegated) + Number(votingPower) -
    votes
      .filter(v => v.address !== address)
      .reduce((sum, { value }) => sum + Number(value), 0),
  );

  const focusInput = useCallback(() => {
    if (inputRef && inputRef.current) inputRef.current.focus();
  }, [inputRef]);

  const handleChange = useCallback(
    text => {
      setValue(text);
      setUseAllAmount(false);
    },
    [setValue],
  );

  const toggleUseAllAmount = useCallback(() => {
    handleChange(!useAllAmount ? votesAvailable : 0);
    setUseAllAmount(!useAllAmount);
  }, [handleChange, useAllAmount, votesAvailable]);

  const onContinue = useCallback(
    () => onChange({ address, value: value }),
    [address, onChange, value],
  );

  const remove = useCallback(() => onRemove(vote), [onRemove, vote]);

  const votesRemaining = useMemo(
    () => Math.max(0, votesAvailable - Number(value)),
    [value, votesAvailable],
  );

  const error = Number(value) <= 0 || Number(value) > votesAvailable;

  return (
    <BottomDrawer
      isOpen={!!vote}
      onClose={onClose}
      onModalShow={focusInput}
      title={name || address}
      subtitle={t("vote.castVotes.voteFor")}
    >
      <View style={{ height: "100%" }}>
        <KeyboardView style={{ flex: 1 }} behavior="padding">
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
          <Flex flexDirection={"row"} justifyContent={"flex-end"}>
            <Link onPress={remove} Icon={TrashMedium}>
              {t("vote.castVotes.removeVotes")}
            </Link>
          </Flex>
          <View
            style={[styles.bottomWrapper, { borderTopColor: colors.lightGrey }]}
          >
            <View style={[styles.availableRow, styles.row]}>
              <View style={styles.available}>
                {error && Number(value) <= 0 ? (
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
                <Switch
                  value={useAllAmount}
                  onValueChange={toggleUseAllAmount}
                  label={t("send.amount.useMax")}
                />
              </View>
            </View>
            <Button
              type="main"
              event="IconValidateVote"
              onPress={onContinue}
              disabled={!!error}
              alignSelf={"stretch"}
            >
              <Trans i18nKey="vote.castVotes.validateVotes" />
            </Button>
          </View>
        </KeyboardView>
      </View>
    </BottomDrawer>
  );
};

const styles = StyleSheet.create({
  bottomWrapper: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
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
    justifyContent: "center",
    flexGrow: 1,
  },
  inputStyle: {
    ...getFontStyle(),
    padding: 30,
    fontSize: 32,
  },
  availableSuccess: {
    marginLeft: 10,
  },
});

export default memo<Props>(IconVoteModal);
