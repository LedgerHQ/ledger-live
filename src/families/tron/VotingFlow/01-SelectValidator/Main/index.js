// @flow
import React, { memo } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { SectionList } from "react-navigation";

import type { SuperRepresentative } from "@ledgerhq/live-common/lib/families/tron/types";
import type { Transaction } from "@ledgerhq/live-common/lib/types";

import colors from "../../../../../colors";
import CheckBox from "../../../../../components/CheckBox";
import LText from "../../../../../components/LText";
import Trophy from "../../../../../icons/Trophy";
import Medal from "../../../../../icons/Medal";
import { getIsVoted, useSelectValidatorContext } from "../utils";
import SelectValidatorSearchBox from "./SearchBox";
import { Trans } from "react-i18next";

type ItemProps = {
  item: {
    address: string,
    sr: SuperRepresentative,
    isSR: boolean,
    rank: number,
  },
  transaction: Transaction,
  remainingCount: number,
  onSelectSuperRepresentative: (item: {
    address: string,
    sr: SuperRepresentative,
    isSR: boolean,
    rank: number,
  }) => void,
};

const RenderItem = ({
  item,
  transaction,
  remainingCount,
  onSelectSuperRepresentative,
}: ItemProps) => {
  const { address, sr, isSR, rank } = item;
  const isVoted = getIsVoted(transaction, address);
  const disabled = !isVoted && remainingCount <= 0;

  return (
    <TouchableOpacity
      onPress={() => onSelectSuperRepresentative(item)}
      disabled={disabled}
      style={styles.wrapper}
    >
      <View
        style={[styles.iconWrapper, !isSR ? styles.iconWrapperCandidate : {}]}
      >
        {isSR ? (
          <Trophy size={16} color={colors.live} />
        ) : (
          <Medal size={16} color={colors.grey} />
        )}
      </View>

      <View style={styles.nameWrapper}>
        <LText semiBold style={styles.nameText}>
          {rank}. {sr.name}
        </LText>

        <LText style={styles.subText}>
          <Trans
            i18nKey="vote.castVotes.nbOfVotes"
            values={{ amount: Number(sr.voteCount).toLocaleString() }}
          />
        </LText>
      </View>

      {/** <View style={styles.yieldWrapper}>
        <LText semiBold style={styles.yieldText}>
          {"6,8"} %
        </LText>

        <LText style={styles.subText}>Est. yield</LText>
      </View> */}

      <View>
        <CheckBox isChecked={isVoted} disabled={disabled} />
      </View>
    </TouchableOpacity>
  );
};

const Item = memo(RenderItem);

export default function SelectValidatorMain() {
  const {
    onSelectSuperRepresentative,
    sections,
    transaction,
    remainingCount,
    t,
  } = useSelectValidatorContext();

  return (
    <>
      <SelectValidatorSearchBox />
      <SectionList
        sections={sections}
        keyExtractor={({ address }, i) => address + i}
        renderSectionHeader={({ section: { type } }) => (
          <View style={styles.sectionHeaderWrapper}>
            <LText style={styles.sectionHeaderText}>
              {t(`tron.voting.flow.selectValidator.sections.title.${type}`)}
            </LText>
          </View>
        )}
        renderItem={({ item }) => (
          <Item
            item={item}
            transaction={transaction}
            remainingCount={remainingCount}
            onSelectSuperRepresentative={onSelectSuperRepresentative}
          />
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  sectionHeaderWrapper: {
    paddingHorizontal: 16,
    height: 32,
    justifyContent: "center",
    backgroundColor: colors.lightGrey,
  },
  sectionHeaderText: {
    color: colors.smoke,
  },
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  iconWrapper: {
    height: 36,
    width: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 5,
    backgroundColor: colors.lightLive,
    marginRight: 12,
  },
  iconWrapperCandidate: {
    backgroundColor: colors.lightFog,
  },
  nameWrapper: {
    flex: 1,
  },
  nameText: {
    fontSize: 15,
  },
  subText: {
    fontSize: 13,
    color: colors.grey,
  },
  yieldWrapper: {
    alignItems: "center",
    marginRight: 12,
  },
  yieldText: {
    fontSize: 17,
  },
});
