import React, { memo } from "react";
import { Linking } from "react-native";
import { Trans } from "react-i18next";
import { Account } from "@ledgerhq/live-common/lib/types/account";
import { getAccountCurrency } from "@ledgerhq/live-common/lib/account/helpers";
import { Flex } from "@ledgerhq/native-ui";
import ExternalLink from "../../icons/ExternalLink";
import Button from "../../components/wrappedUi/Button";

type Props = {
  url?: string;
  urlWhatIsThis?: string;
  account: Account;
};

function Footer({ url, urlWhatIsThis, account }: Props) {
  const currencyId = getAccountCurrency(account).name;
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
