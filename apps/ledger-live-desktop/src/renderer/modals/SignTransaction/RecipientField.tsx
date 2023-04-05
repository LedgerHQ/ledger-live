import React, { memo, useMemo } from "react";

import { Trans } from "react-i18next";
import { useDomain } from "@ledgerhq/domain-service/index";
import { CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import { isLoaded } from "@ledgerhq/domain-service/hooks/logic";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

import Ellipsis from "~/renderer/components/Ellipsis";
import Text from "~/renderer/components/Text";
import Box from "~/renderer/components/Box";
import { StepProps } from "./types";
import invariant from "invariant";

const DefaultRecipientTemplate = memo(({ transaction }: Pick<StepProps, "transaction">) => {
  invariant(transaction, "transaction is missing");

  return (
    <Box flex={1}>
      <Text ff="Inter|Medium" color="palette.text.shade40" fontSize={4}>
        <Trans i18nKey="send.steps.details.to" />
      </Text>
      {transaction.recipientDomain && (
        <Text ff="Inter|Bold" color="palette.text.shade100" fontSize={4}>
          {transaction.recipientDomain.domain}
        </Text>
      )}
      <Ellipsis>
        <Text
          ff="Inter"
          color={transaction.recipientDomain ? "palette.text.shade70" : "palette.text.shade100"}
          fontSize={4}
        >
          {transaction.recipient}
        </Text>
      </Ellipsis>
    </Box>
  );
});
DefaultRecipientTemplate.displayName = "DefaultRecipientTemplate";

const RecipientWithResolutionTemplate = memo(({ transaction }: Pick<StepProps, "transaction">) => {
  invariant(transaction, "transaction is missing");

  const domainResolution = useDomain(transaction.recipient || "", "ens");
  const recipientDomain = useMemo(
    () => (isLoaded(domainResolution) ? domainResolution.resolutions[0] : undefined),
    [domainResolution],
  );

  return (
    <Box flex={1}>
      <Text ff="Inter|Medium" color="palette.text.shade40" fontSize={4}>
        <Trans i18nKey="send.steps.details.to" />
      </Text>
      {recipientDomain && (
        <Text ff="Inter|Bold" color="palette.text.shade100" fontSize={4}>
          {recipientDomain.domain}
        </Text>
      )}
      <Ellipsis>
        <Text
          ff="Inter"
          color={recipientDomain ? "palette.text.shade70" : "palette.text.shade100"}
          fontSize={4}
        >
          {transaction.recipient}
        </Text>
      </Ellipsis>
    </Box>
  );
});
RecipientWithResolutionTemplate.displayName = "RecipientWithResolutionTemplate";

const RecipientField = ({
  account,
  parentAccount,
  transaction,
}: Pick<StepProps, "account" | "parentAccount" | "transaction">) => {
  invariant(account, "account is missing");
  invariant(transaction, "transaction is missing");

  const mainAccount = getMainAccount(account, parentAccount);

  const { enabled: isDomainResolutionEnabled, params } =
    useFeature<{ supportedCurrencyIds: CryptoCurrencyId[] }>("domainInputResolution") || {};
  const isCurrencySupported =
    params?.supportedCurrencyIds?.includes(mainAccount.currency.id as CryptoCurrencyId) || false;

  const shouldTryResolvingDomain = useMemo<boolean>(() => {
    if (transaction.recipientDomain) {
      return false;
    }
    return !!isDomainResolutionEnabled && isCurrencySupported;
  }, [transaction.recipientDomain, isDomainResolutionEnabled, isCurrencySupported]);

  return shouldTryResolvingDomain ? (
    <RecipientWithResolutionTemplate transaction={transaction} />
  ) : (
    <DefaultRecipientTemplate transaction={transaction} />
  );
};

export default memo(RecipientField);
