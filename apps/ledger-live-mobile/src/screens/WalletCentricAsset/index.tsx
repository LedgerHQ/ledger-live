import React, { useMemo } from "react";
import { FlatList } from "react-native";
import Animated from "react-native-reanimated";
import { useSelector } from "react-redux";
import { getAccountCurrency } from "@ledgerhq/live-common/src/account";
import accountSyncRefreshControl from "../../components/accountSyncRefreshControl";
import { withDiscreetMode } from "../../context/DiscreetModeContext";
import TabBarSafeAreaView, {
  TAB_BAR_SAFE_HEIGHT,
} from "../../components/TabBar/TabBarSafeAreaView";
import { accountsSelector } from "../../reducers/accounts";
import OperationsHistorySection from "../WalletCentricSections/OperationsHistory";

type RouteParams = {
  currencyId: string;
};

type Props = {
  navigation: any;
  route: { params: RouteParams };
};

const AnimatedFlatListWithRefreshControl = Animated.createAnimatedComponent(
  accountSyncRefreshControl(FlatList),
);

const AssetScreen = ({ route }: Props) => {
  const accounts = useSelector(accountsSelector);
  const { currencyId } = route?.params;
  const cryptoAccounts = useMemo(
    () => accounts.filter(a => getAccountCurrency(a).id === currencyId),
    [accounts, currencyId],
  );

  const data = useMemo(
    () => [<OperationsHistorySection accounts={cryptoAccounts} />],
    [cryptoAccounts],
  );

  return (
    <TabBarSafeAreaView edges={["bottom", "left", "right"]}>
      <AnimatedFlatListWithRefreshControl
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_HEIGHT }}
        data={data}
        renderItem={({ item }: any) => item}
        keyExtractor={(_: any, index: any) => String(index)}
        showsVerticalScrollIndicator={false}
      />
    </TabBarSafeAreaView>
  );
};

export default withDiscreetMode(AssetScreen);
