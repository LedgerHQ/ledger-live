import React from "react";
import { useNetInfo } from "@react-native-community/netinfo";
import { Text, InfiniteLoader } from "@ledgerhq/native-ui";
import { Trans, useTranslation } from "react-i18next";
import EmptyState from "../EmptyState";
import EmptyStarredCoins from "../EmptyStarredCoins";

const noResultIllustration = {
  dark: require("~/images/illustration/Dark/_051.png"),
  light: require("~/images/illustration/Light/_051.png"),
};

const noNetworkIllustration = {
  dark: require("~/images/illustration/Dark/_078.png"),
  light: require("~/images/illustration/Light/_078.png"),
};

interface ListEmptyProps {
  hasEmptyStarredCoins: boolean;
  hasNoSearchResult: boolean;
  search?: string;
  resetSearch: () => void;
}

function ListEmpty({
  hasEmptyStarredCoins,
  hasNoSearchResult,
  search,
  resetSearch,
}: ListEmptyProps) {
  const { t } = useTranslation();
  const { isConnected } = useNetInfo();

  if (hasNoSearchResult) {
    // No search results
    return (
      <EmptyState
        illustrationSource={noResultIllustration}
        title={t("market.warnings.noCryptosFound")}
        description={
          <Trans i18nKey="market.warnings.noSearchResultsFor" values={{ search }}>
            <Text fontWeight="bold" variant="body" color="neutral.c70">
              {""}
            </Text>
          </Trans>
        }
        buttonText={t("market.warnings.browseAssets")}
        onButtonClick={resetSearch}
      />
    );
  } else if (!isConnected) {
    // Network down
    return (
      <EmptyState
        illustrationSource={noNetworkIllustration}
        title={t("errors.NetworkDown.title")}
        description={t("errors.NetworkDown.description")}
      />
    );
  } else if (hasEmptyStarredCoins) {
    // Empty starred coins
    return <EmptyStarredCoins />;
  }

  return <InfiniteLoader size={30} />;
}

export default ListEmpty;
