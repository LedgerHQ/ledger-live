import { MarketListRequestParams } from "@ledgerhq/live-common/market/utils/types";
import { Flex, Text } from "@ledgerhq/react-ui";
import { TFunction } from "i18next";
import React from "react";
import { Trans } from "react-i18next";
import Track from "~/renderer/analytics/Track";
import Image from "~/renderer/components/Image";

import NoResultsFoundDark from "~/renderer/images/no-results-found-dark.png";
import NoResultsFoundLight from "~/renderer/images/no-results-found-light.png";

import { Button } from "../..";

type NoCryptoPlaceholderProps = {
  requestParams: MarketListRequestParams;
  t: TFunction;
  resetSearch: () => void;
};

export const NoCryptoPlaceholder = ({
  requestParams,
  t,
  resetSearch,
}: NoCryptoPlaceholderProps) => (
  <Flex
    mt={7}
    mx={"auto"}
    justifyContent="center"
    alignItems="stretch"
    width="400px"
    flexDirection="column"
  >
    <Track event="Page Market Search" success={false} />
    <Flex justifyContent="center" alignItems="center">
      <Image
        alt="no result found"
        resource={{ dark: NoResultsFoundDark, light: NoResultsFoundLight }}
        width={192}
        height={192}
      />
    </Flex>
    <Text variant="large" my={3} textAlign="center">
      {t("market.warnings.noCryptosFound")}
    </Text>
    <Text variant="paragraph" textAlign="center">
      <Trans
        i18nKey={
          requestParams.search
            ? "market.warnings.noSearchResultsFor"
            : "market.warnings.noSearchResults"
        }
        values={{ search: requestParams.search }}
      >
        <b />
      </Trans>
    </Text>
    <Button mt={3} variant="main" onClick={resetSearch} big width="100%">
      {t("market.goBack")}
    </Button>
  </Flex>
);
