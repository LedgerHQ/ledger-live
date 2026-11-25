import React, { useCallback } from "react";
import { FlatList, type ListRenderItem } from "react-native";
import {
  Banner,
  Box,
  Button,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  SearchInput,
  Spinner,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import { TrackScreen } from "@shared/analytics-react";
import CurrencyIcon from "~/components/CurrencyIcon";
import SafeAreaView from "~/components/SafeAreaView";
import { useTranslation } from "~/context/Locale";
import { type Props, useSelectTokenViewModel } from "./useSelectTokenViewModel";

function keyExtractor(token: TokenCurrency) {
  return token.id;
}

export default function SelectToken(props: Props) {
  const { t } = useTranslation();
  const viewModel = useSelectTokenViewModel(props);
  const { onSelectToken } = viewModel;

  const renderItem: ListRenderItem<TokenCurrency> = useCallback(
    ({ item: token }) => (
      <ListItem onPress={() => onSelectToken(token)} testID={`xrp-token-row-${token.id}`}>
        <ListItemLeading>
          <CurrencyIcon currency={token} size={40} />
          <ListItemContent>
            <ListItemTitle>{token.name}</ListItemTitle>
            <ListItemDescription>
              {`${token.ticker} · ${formatAddress(token.contractAddress)}`}
            </ListItemDescription>
          </ListItemContent>
        </ListItemLeading>
      </ListItem>
    ),
    [onSelectToken],
  );

  const renderEmpty = () => {
    if (viewModel.isLoading) {
      return <Spinner />;
    }

    if (viewModel.isError) {
      return (
        <Banner
          appearance="error"
          title={t("xrp.addToken.steps.token.loadError")}
          primaryAction={
            <Button appearance="gray" size="sm" onPress={viewModel.onRetry}>
              {t("common.retry")}
            </Button>
          }
        />
      );
    }

    return (
      <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
        {t("xrp.addToken.steps.token.empty")}
      </Text>
    );
  };

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} isFlex>
      <TrackScreen category="XrpAddTokenFlow" name="SelectToken" />
      <Box lx={{ flex: 1, paddingHorizontal: "s16", gap: "s16" }}>
        <SearchInput
          placeholder={t("common.search")}
          value={viewModel.search}
          onChangeText={viewModel.onChangeSearch}
          testID="xrp-token-search"
        />
        <FlatList
          data={viewModel.tokens}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ListEmptyComponent={renderEmpty}
          onEndReached={viewModel.onEndReached}
          onEndReachedThreshold={0.5}
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        />
      </Box>
    </SafeAreaView>
  );
}
