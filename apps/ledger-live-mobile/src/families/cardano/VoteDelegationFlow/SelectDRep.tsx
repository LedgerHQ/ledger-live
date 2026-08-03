import React, { useCallback } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { useTranslation, Trans } from "~/context/Locale";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import { ScreenName } from "~/const";
import { TrackScreen } from "~/analytics";
import KeyboardView from "~/components/KeyboardView";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { SearchInput, Box, InfiniteLoader, Flex, Text } from "@ledgerhq/native-ui";
import NoResultsFound from "~/icons/NoResultsFound";
import { CardanoVoteDelegationFlowParamList } from "./types";
import { useCardanoFamilyDReps } from "@ledgerhq/live-common/families/cardano/react";
import { DRep } from "@ledgerhq/live-common/families/cardano/DRep";
import DRepRow from "./DRepRow";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import { CryptoCurrency } from "@domain/entity-currency-crypto";

type Props = StackNavigatorProps<
  CardanoVoteDelegationFlowParamList,
  ScreenName.CardanoVoteDelegationSelectDRep
>;

export default function SelectDRep({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { account } = useAccountScreen(route);
  const currency: CryptoCurrency | undefined =
    account && account.type === "Account" ? account.currency : undefined;

  const { dReps, searchQuery, setSearchQuery, onScrollEndReached, isSearching, isPaginating } =
    useCardanoFamilyDReps(currency!);

  const onSelectDRep = useCallback(
    (drep: DRep) => {
      navigation.navigate(ScreenName.CardanoVoteDelegationSummary, {
        ...route.params,
        drep,
        option: undefined,
      });
    },
    [navigation, route.params],
  );

  const renderItem = useCallback(
    ({ item }: { item: DRep }) => {
      return <DRepRow drep={item} onPress={onSelectDRep} />;
    },
    [onSelectDRep],
  );

  const keyExtractor = useCallback((drep: DRep, index: number) => `${drep.hex}-${index}`, []);

  const ListFooterComponent = useCallback(() => {
    if (!isPaginating) return null;
    return (
      <Box p={4} alignItems="center">
        <InfiniteLoader />
      </Box>
    );
  }, [isPaginating]);

  const ListEmptyComponent = useCallback(() => {
    if (isSearching || isPaginating || dReps.length > 0 || !searchQuery) return null;
    return (
      <Flex alignItems="center" justifyContent="center" pb="50px" pt="30px">
        <NoResultsFound />
        <Text color="neutral.c100" fontWeight="medium" variant="body" mt={6} textAlign="center">
          <Trans i18nKey="cardano.voteDelegation.noDRepFound" values={{ search: searchQuery }}>
            <Text fontWeight="bold">{""}</Text>
          </Trans>
        </Text>
      </Flex>
    );
  }, [isSearching, isPaginating, dReps.length, searchQuery]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen category="VoteDelegationFlow" name="SelectDRep" />
      <KeyboardView style={styles.keyboardView}>
        <View style={styles.searchContainer}>
          <SearchInput
            value={searchQuery}
            placeholder={t("cardano.voteDelegation.search")}
            onChange={setSearchQuery}
          />
        </View>
        <FlatList
          data={dReps}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          onEndReached={onScrollEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={ListFooterComponent}
          ListEmptyComponent={ListEmptyComponent}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
        />
      </KeyboardView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
});
