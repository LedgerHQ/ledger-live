import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";
import { useTheme } from "styled-components/native";

import { Flex, Text } from "@ledgerhq/native-ui";
import Circle from "~/components/Circle";
import MemoIcon from "~/icons/MemoIcon";
import SummaryRowCustom from "~/screens/SendFunds/SummaryRowCustom";

type Props = {
  title?: string;
  editLabel?: string;
  memoTag: string;
  editMemo: () => void;
};

export function GenericMemoTagSummary({
  title = "send.summary.memo.title",
  editLabel = "common.edit",
  memoTag,
  editMemo,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <SummaryRowCustom
      label={t(title)}
      iconLeft={
        <Circle bg={colors.opacityDefault.c05} size={34}>
          <MemoIcon color={colors.primary.c80} />
        </Circle>
      }
      data={
        <Flex pt={2}>
          <Text fontSize={13} onPress={editMemo} numberOfLines={1}>
            {memoTag}
          </Text>
          <Text
            fontSize={13}
            style={[
              styles.link,
              {
                textDecorationColor: colors.primary.c80,
              },
            ]}
            color="live"
            onPress={editMemo}
          >
            {t(editLabel)}
          </Text>
        </Flex>
      }
    />
  );
}

const styles = StyleSheet.create({
  link: {
    position: "absolute",
    right: 0,
    textDecorationLine: "underline",
    textDecorationStyle: "solid",
    top: 0,
    transform: [{ translateY: -4 }],
  },
});
