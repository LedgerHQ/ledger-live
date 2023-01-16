import { useTheme } from "@react-navigation/native";
import invariant from "invariant";
import React, { useCallback, useState, useEffect, useMemo, useRef } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native";
import { useSelector } from "react-redux";
import type { StakePool, APIGetPoolList } from "@ledgerhq/live-common/families/cardano/api/api-types";
import { fetchPoolList } from "@ledgerhq/live-common/families/cardano/api/getPools";
import { TrackScreen } from "../../../analytics";
import { ScreenName } from "../../../const";
import { accountScreenSelector } from "../../../reducers/accounts";
import PoolHead from "../shared/PoolHead";
import PoolRow from "../shared/PoolRow";
import SelectPoolSearchBox from "../shared/SearchBox";

type Props = {
  navigation: any;
  route: { params: RouteParams };
};

type RouteParams = {
  accountId: string;
  pool?: StakePool;
};

export default function SelectPool({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));

  invariant(account, "account must be defined");
  invariant(account.type === "Account", "account must be of type Account");

  const [pools, setPools] = useState([]as Array<StakePool>);

  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef(searchQuery);
  searchRef.current = searchQuery;

  const limit = 100;
  let pageNo = 1;
  let isPaginationDisabled = useRef(false);

  const loadPage = () => {
    fetchPoolList(account.currency, searchQuery, pageNo, limit).then((apiRes: APIGetPoolList) => {
      setPools(currentPools => {
        return [
          ...currentPools,
          ...apiRes.pools,
        ];
      });
    });
  };

  useEffect(() => {
    isPaginationDisabled.current = false;
    pageNo = 1;

    const delayDebounceFn = setTimeout(() => {
      fetchPoolList(account.currency, searchQuery, pageNo, limit).then((apiRes: APIGetPoolList) => {
        setPools([
          ...apiRes.pools,
        ]);  
  
        if (searchQuery && apiRes.pools.length < limit) {
          isPaginationDisabled.current = true;
        }
      });
    }, searchQuery ? 500 : 0)

    return ()=>clearInterval(delayDebounceFn);
    
  }, [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const onScrollEndReached = useCallback(
    () => {
      if (isPaginationDisabled.current) return;
      
      pageNo++;
      loadPage();
    },
    [pageNo],
  );

  
  const onItemPress = useCallback(
    (pool: StakePool) => {
      navigation.navigate(ScreenName.CardanoDelegationSummary, {
        ...route.params,
        pool,
      });
    },
    [navigation, route.params],
  );

  const renderItem = useCallback(
    ({ item }: { item: StakePool }) => (
      <PoolRow account={account} pool={item} onPress={onItemPress} />
    ),
    [onItemPress, account],
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen category="DelegationFlow" name="SelectValidator" />
      <SelectPoolSearchBox
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      <View style={styles.header}>
        <PoolHead />
      </View>
      <FlatList
        contentContainerStyle={styles.list}
        data={pools}
        renderItem={renderItem}
        extraData={{}}
        onEndReachedThreshold={1}
        onEndReached={onScrollEndReached}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    height: "100%",
  },
  header: {
    padding: 16,
  },
  list: {
    paddingHorizontal: 16,
    flexGrow: 1,
  },
});
