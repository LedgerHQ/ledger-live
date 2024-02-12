import React, { memo } from "react";
import { Linking } from "react-native";
import { Trans } from "react-i18next";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Flex } from "@ledgerhq/native-ui";

import ExternalLink from "~/icons/ExternalLink";
import Button from "~/components/wrappedUi/Button";

type Props = {
  url?: string | null;
  urlWhatIsThis?: string | null;
  currency: CryptoCurrency | TokenCurrency;
};

function Footer({ url, urlWhatIsThis, currency }: Props) {
  const { name: currencyId } = currency;

  return (
    <Flex bg={"background.main"} px={6} my={6}>
      {urlWhatIsThis ? (
        <Button
          event="WhatIsThisOperation"
          type="main"
          Icon={ExternalLink}
          onPress={() => Linking.openURL(urlWhatIsThis)}
          outline
        >
          <Trans i18nKey="operationDetails.whatIsThis" />
        </Button>
      ) : null}
      {url ? (
        <Button
          event="OperationDetailViewInExplorer"
          type="main"
          onPress={() => Linking.openURL(url)}
          eventProperties={{
            currencyId,
          }}
          outline
          mt={4}
        >
          <Trans i18nKey="operationDetails.viewInExplorer" />
        </Button>
      ) : null}
    </Flex>
  );
}

export default memo<Props>(Footer);
