import React, { useCallback, memo, useRef, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { Trans } from "react-i18next";

import {
  Vote,
  SuperRepresentative,
} from "@ledgerhq/live-common/families/tron/types";

import Swipeable from "react-native-gesture-handler/Swipeable";
import * as Animatable from "react-native-animatable";

import { useTheme } from "@react-navigation/native";
import { Box, BoxedIcon, Text } from "@ledgerhq/native-ui";
import {
  MedalMedium,
  TrophyMedium,
  PenMedium,
} from "@ledgerhq/native-ui/assets/icons";
import getWindowDimensions from "../../../logic/getWindowDimensions";
import Trash from "../../../icons/Trash";

const { width } = getWindowDimensions();

const RightAction = ({
  dragX,
  onRemove,
}: {
  dragX: Animated.AnimatedInterpolation;
  onRemove: () => void;
}) => {
  const { colors } = useTheme();
  const scale = dragX.interpolate({
    inputRange: [-57, -56, -16, 0],
    outputRange: [1, 1, 0.5, 0],
  });

  return (
    <Animated.View
      style={[
        styles.rightDrawer,
        {
          transform: [{ scale }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={onRemove}
        style={[styles.removeButton, { backgroundColor: colors.alert }]}
      >
        <Trash size={16} color={colors.white} />
      </TouchableOpacity>
    </Animated.View>
  );
};

type VoteRowProps = {
  vote: Vote & {
    isSR: boolean;
    rank: number;
    validator?: SuperRepresentative | null;
  };
  onEdit: (vote: Vote, name: string) => void;
  onRemove: (vote: Vote) => void;
  index: number;
  onOpen: (i: number) => void;
  openIndex: number;
};

const VoteRow = ({
  vote,
  onEdit,
  onRemove,
  index,
  onOpen,
  openIndex,
}: VoteRowProps) => {
  const { colors } = useTheme();
  const rowRef = useRef<Animatable.View & View>(null);
  const swipeRef = useRef<Swipeable>(null);
  const { address, voteCount, isSR, rank, validator } = vote;
  const { name } = validator || {};

  /** Animate swipe gesture at the begining */
  useEffect(() => {
    if (index === 0 && swipeRef && swipeRef.current) {
      setTimeout(() => {
        if (swipeRef.current && swipeRef.current.openRight) {
          swipeRef.current.openRight();
          setTimeout(() => {
            if (swipeRef.current && swipeRef.current.close)
              swipeRef.current.close();
          }, 1000);
        }
      }, 400);
    }
  }, [index, swipeRef]);

  const removeVote = useCallback(
    () => onRemove({ address, voteCount }),
    [address, voteCount, onRemove],
  );

  useEffect(() => {
    if (openIndex !== index && swipeRef.current && swipeRef.current.close)
      swipeRef.current.close();
  }, [index, openIndex, swipeRef]);

  const removeVoteAnimStart = useCallback(() => {
    if (rowRef && rowRef.current && rowRef.current.transitionTo)
      rowRef.current.transitionTo(
        { opacity: 0, height: 0, marginVertical: 0 },
        400,
      );
    else removeVote();
  }, [rowRef, removeVote]);

  return (
    <Animatable.View
      style={styles.root}
      ref={rowRef}
      onTransitionEnd={removeVote}
    >
      <Swipeable
        ref={swipeRef}
        friction={2}
        rightThreshold={27}
        overshootRight={false}
        renderRightActions={(_progress, dragX) => (
          <RightAction dragX={dragX} onRemove={removeVoteAnimStart} />
        )}
        onSwipeableRightWillOpen={() => onOpen(index)}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.srRow,
            { backgroundColor: colors.card, borderColor: colors.lightFog },
          ]}
          onPress={() => onEdit({ address, voteCount }, name || address)}
        >
          <View style={styles.row}>
            <Box mr={4}>
              <BoxedIcon Icon={isSR ? TrophyMedium : MedalMedium} />
            </Box>
            <View style={styles.rowLabelContainer}>
              <Text
                variant={"body"}
                fontWeight={"semiBold"}
                numberOfLines={1}
                pb={1}
              >
                {name || address}
              </Text>
              <Text
                variant={"small"}
                fontWeight={"medium"}
                color={"neutral.c80"}
              >
                <Trans i18nKey="vote.castVotes.ranking" values={{ rank }}>
                  <Text
                    variant={"small"}
                    fontWeight={"medium"}
                    color={"neutral.c100"}
                  >
                    PLACEHOLDER_TEXT
                  </Text>
                </Trans>
              </Text>
            </View>
            <View style={styles.editButton}>
              <PenMedium size={20} color={"neutral.c100"} />
              <Text
                variant={"paragraph"}
                fontWeight={"semiBold"}
                color={"neutral.c100"}
                ml={3}
              >
                {voteCount}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Swipeable>
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  root: {
    height: 80,
    width: "100%",
    marginVertical: 5,
    overflow: "visible",
  },
  srRow: {
    height: 75,
    width: width - 32,
    left: 16,
    borderRadius: 4,
    flexDirection: "column",
    zIndex: 10,
    paddingHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",

    paddingVertical: 8,
  },
  rowIcon: {
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    borderRadius: 5,

    marginRight: 12,
  },
  rowTitle: {
    fontSize: 14,
    lineHeight: 16,

    paddingBottom: 4,
  },
  rowLabelContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "flex-end",
    flex: 1,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  editVoteCount: {
    fontSize: 17,

    marginLeft: 6,
    marginBottom: 2,
  },
  rowLabel: {
    fontSize: 13,
  },
  rightDrawer: {
    width: 56,
    paddingRight: 16,
    height: "100%",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  removeButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    borderRadius: 4,
  },
});

export default memo<VoteRowProps>(VoteRow);
