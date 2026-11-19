import React, { useCallback, useRef } from "react";
import { type ListRenderItem, type TextInput } from "react-native";
import {
  Banner,
  BottomSheetFlatList,
  BottomSheetHeader,
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
import { TrackScreen } from "@shared/analytics-react";
import { InfoState } from "@shared/ui-info-state";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { useBottomSheetKeyboardAwareInput } from "@shared/ui-queued-bottom-sheet/keyboard";
import CurrencyIcon from "~/components/CurrencyIcon";
import { useTranslation } from "~/context/Locale";
import { type Props, type TokenItem, useSelectTokenViewModel } from "./useSelectTokenViewModel";

function keyExtractor(item: TokenItem) {
  return item.token.id;
}

function Search(props: Readonly<{ value: string; onChangeText: (text: string) => void }>) {
  const { t } = useTranslation();
  const inputRef = useRef<TextInput>(null);
  const inputProps = useBottomSheetKeyboardAwareInput(inputRef);

  return (
    <Box lx={{ paddingHorizontal: "s16", paddingBottom: "s8" }}>
      <SearchInput
        ref={inputRef}
        {...inputProps}
        placeholder={t("common.search")}
        value={props.value}
        onChangeText={props.onChangeText}
        testID="xrp-token-search"
      />
    </Box>
  );
}

export default function SelectToken(props: Props) {
  const { t } = useTranslation();
  const viewModel = useSelectTokenViewModel(props);
  const { onSelectToken } = viewModel;

  const renderItem: ListRenderItem<TokenItem> = useCallback(
    ({ item }) => {
      const token = item.token;
      const tokenType = t(
        token.tokenType === "iou"
          ? "xrp.addToken.steps.review.tokenTypeIou"
          : "xrp.addToken.steps.review.tokenTypeMpt",
      );

      return (
        <ListItem onPress={() => onSelectToken(token)} testID={`xrp-token-row-${token.id}`}>
          <ListItemLeading>
            <CurrencyIcon currency={token} size={40} />
            <ListItemContent>
              <ListItemTitle>{token.name}</ListItemTitle>
              <ListItemDescription>
                {item.hasSharedTicker ? `${token.ticker} · ${tokenType}` : token.ticker}
              </ListItemDescription>
            </ListItemContent>
          </ListItemLeading>
        </ListItem>
      );
    },
    [onSelectToken, t],
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
        {t("xrp.addToken.steps.token.noResults")}
      </Text>
    );
  };

  return (
    <>
      <TrackScreen category="XrpAddTokenFlow" name="SelectToken" />
      <QueuedBottomSheet
        isRequestingToBeOpened={!viewModel.isEmpty}
        onClose={viewModel.isEmpty ? undefined : viewModel.onClose}
        snapPoints="full"
        restoreOnFocus
        testID="xrp-select-token-sheet"
      >
        <BottomSheetHeader spacing density="expanded" title={t("xrp.addToken.steps.token.title")} />
        <Search value={viewModel.search} onChangeText={viewModel.onChangeSearch} />
        <BottomSheetFlatList
          data={viewModel.items}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ListEmptyComponent={renderEmpty}
          onEndReached={viewModel.onEndReached}
          onEndReachedThreshold={0.5}
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        />
      </QueuedBottomSheet>
      <QueuedBottomSheet
        isRequestingToBeOpened={viewModel.isEmpty}
        onClose={viewModel.onClose}
        enableDynamicSizing
        testID="xrp-no-assets-sheet"
      >
        <Box lx={{ paddingHorizontal: "s16" }}>
          <InfoState
            size="hug"
            preset="error"
            title={t("xrp.addToken.steps.token.noAssetsTitle")}
            description={t("xrp.addToken.steps.token.noAssetsText")}
            primaryCta={{
              label: t("xrp.addToken.steps.token.gotIt"),
              onPress: viewModel.onClose,
              testID: "xrp-no-assets-got-it",
            }}
          />
        </Box>
      </QueuedBottomSheet>
    </>
  );
}
