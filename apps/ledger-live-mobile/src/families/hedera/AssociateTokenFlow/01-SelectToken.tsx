import React, { useCallback, useMemo } from "react";
import { FlatList } from "react-native";
import { useSelector } from "react-redux";
import { Trans, useTranslation } from "react-i18next";
import { Flex, Text } from "@ledgerhq/native-ui";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getEnv } from "@ledgerhq/live-env";
import { useTokensData } from "@ledgerhq/cryptoassets/cal-client/hooks/useTokensData";
import { getMainAccount } from "@ledgerhq/coin-framework/account/helpers";
import invariant from "invariant";

import { TrackScreen, track } from "~/analytics";
import BigCurrencyRow from "~/components/BigCurrencyRow";
import FilteredSearchBar from "~/components/FilteredSearchBar";
import SafeAreaView from "~/components/SafeAreaView";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { NavigatorName, ScreenName } from "~/const";
import type { HederaAssociateTokenFlowParamList } from "~/families/hedera/AssociateTokenFlow/types";
import { accountScreenSelector } from "~/reducers/accounts";

type Props = BaseComposite<
  StackNavigatorProps<HederaAssociateTokenFlowParamList, ScreenName.HederaAssociateTokenSelectToken>
>;

const SEARCH_KEYS = getEnv("CRYPTO_ASSET_SEARCH_KEYS");

const keyExtractor = (currency: CryptoOrTokenCurrency) => currency.id;

const renderEmptyList = () => (
  <Flex px={6}>
    <Text textAlign="center">
      <Trans i18nKey="common.noCryptoFound" />
    </Text>
  </Flex>
);

export default function SelectToken({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));

  const { data, loadNext } = useTokensData({
    networkFamily: "hedera",
    pageSize: 100,
  });

  const list = useMemo(() => {
    return data?.tokens || [];
  }, [data?.tokens]);

  const mainAccount = account ? getMainAccount(account, parentAccount) : null;

  const onPressItem = useCallback(
    (currency: CryptoOrTokenCurrency) => {
      if (currency.type !== "TokenCurrency") return;
      invariant(mainAccount, "hedera: mainAccount is missing");

      const subAccount = (mainAccount?.subAccounts ?? []).find(acc => acc.token.id === currency.id);
      const isAlreadyAssociated = !!subAccount;

      track("asset_clicked", {
        currency: currency.parentCurrency,
        asset: currency.name,
        page: ScreenName.HederaAssociateTokenSelectToken,
        isAlreadyAssociated,
      });

      if (isAlreadyAssociated) {
        navigation.navigate(NavigatorName.ReceiveFunds, {
          screen: ScreenName.ReceiveConfirmation,
          params: {
            currency,
            accountId: subAccount.id,
            parentId: subAccount.parentId,
          },
        });
      } else {
        navigation.navigate(ScreenName.HederaAssociateTokenSummary, {
          accountId: mainAccount.id,
          tokenAddress: currency.contractAddress,
        });
      }
    },
    [mainAccount, navigation],
  );

  const renderList = useCallback(
    (items: CryptoOrTokenCurrency[]) => (
      <FlatList
        data={items}
        renderItem={({ item }) => (
          <BigCurrencyRow currency={item} onPress={onPressItem} subTitle={item.ticker} />
        )}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        onEndReached={loadNext}
        onEndReachedThreshold={0.5}
      />
    ),
    [onPressItem, loadNext],
  );

  return (
    <SafeAreaView edges={["left", "right"]} isFlex>
      <TrackScreen category="AssociateTokenFlow" name="SelectToken" currency="hedera" />
      <Text variant="h4" fontWeight="semiBold" mx={6}>
        {t("hedera.associate.selectToken.title")}
      </Text>
      {list.length > 0 ? (
        <Flex flex={1} ml={6} mr={6} mt={3}>
          <FilteredSearchBar
            keys={SEARCH_KEYS}
            list={list}
            renderList={renderList}
            renderEmptySearch={renderEmptyList}
          />
        </Flex>
      ) : (
        renderEmptyList()
      )}
    </SafeAreaView>
  );
}
