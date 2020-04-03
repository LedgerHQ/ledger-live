// @flow
import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { SectionList } from "react-navigation";
import colors from "../../../../../colors";
import LText from "../../../../../components/LText";
import { useSelectValidatorContext } from "../utils";
import SelectValidatorSearchBox from "./SearchBox";
import Item from "./Item";

export default function SelectValidatorMain() {
  const {
    onSelectSuperRepresentative,
    sections,
    transaction,
    remainingCount,
    t,
  } = useSelectValidatorContext();

  return useMemo(
    () => (
      <>
        <SelectValidatorSearchBox />
        <SectionList
          sections={sections}
          keyExtractor={({ address }) => address}
          renderSectionHeader={({ section: { type, data } }) =>
            data.length ? (
              <View style={styles.sectionHeaderWrapper}>
                <LText style={styles.sectionHeaderText}>
                  {t(`tron.voting.flow.selectValidator.sections.title.${type}`)}
                </LText>
              </View>
            ) : null
          }
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
    ),
    // optimize for re-render
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sections, transaction.votes, remainingCount],
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
});
