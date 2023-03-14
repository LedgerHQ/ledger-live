import React, { memo, useCallback, useEffect } from "react";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { Account, AccountBridge } from "@ledgerhq/types-live";
import { TFunction } from "react-i18next";

import { useDomainService } from "@ledgerhq/domain-service/hooks/index";
import {
  DomainServiceResponseLoaded,
  UseDomainServiceResponse,
} from "@ledgerhq/domain-service/hooks/types";

import RecipientFieldBase from "./RecipientFieldBase";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import Alert from "~/renderer/components/Alert";
import Text from "~/renderer/components/Text";
import Box from "~/renderer/components/Box";
import { urls } from "~/config/urls";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import { openURL } from "~/renderer/linking";

type Props = {
  account: Account;
  transaction: Transaction;
  autoFocus?: boolean;
  status: TransactionStatus;
  onChangeTransaction: (tx: Transaction) => void;
  t: TFunction;
  label?: React.ReactNode;
  initValue?: string;
  resetInitValue?: () => void;
  value: string | string;
  bridge: AccountBridge<Transaction>;
  onChange: (recipient: string, maybeExtra?: Record<string, CryptoCurrency>) => Promise<void>;
};

const RecipientField = ({
  t,
  account,
  transaction,
  onChangeTransaction,
  autoFocus,
  status,
  label,
  value = "",
  bridge,
  onChange,
}: Props) => {
  const domainServiceResponse = useDomainService(value);
  const hasValidatedName = useCallback(
    (nsResponse: UseDomainServiceResponse): nsResponse is DomainServiceResponseLoaded =>
      nsResponse.status === "loaded",
    [],
  );

  useEffect(() => {
    const isInitValueDifferent = value !== transaction.domain;
    const isRecipientUpdated = transaction.recipient === transaction.domain;
    if (
      (hasValidatedName(domainServiceResponse) &&
        domainServiceResponse.type === "forward" &&
        (isInitValueDifferent || isRecipientUpdated)) ||
      (hasValidatedName(domainServiceResponse) &&
        domainServiceResponse.type === "reverse" &&
        value !== transaction.recipient)
    ) {
      onChangeTransaction(
        bridge.updateTransaction(transaction, {
          recipient: domainServiceResponse.address,
          domain: domainServiceResponse.domain,
        }),
      );
    }
  }, [bridge, transaction, onChangeTransaction, domainServiceResponse, hasValidatedName, value]);
  const onSupportLinkClick = useCallback(() => openURL(urls.ens), []);

  return (
    <>
      <RecipientFieldBase
        t={t}
        label={label}
        autoFocus={autoFocus}
        status={status}
        account={account}
        value={value}
        onChange={onChange}
      />
      {hasValidatedName(domainServiceResponse) && (
        <Alert mt={5}>
          {domainServiceResponse.type === "forward" ? (
            <>
              <Box>
                <Text ff="Inter" fontSize={3}>
                  {t("send.steps.recipient.namingService.resolve")}
                </Text>
              </Box>
              <Box>
                <Text ff="Inter|SemiBold" fontSize={3}>
                  {domainServiceResponse.address}
                </Text>
              </Box>
            </>
          ) : (
            <>
              <Box>
                <Text ff="Inter" fontSize={3}>
                  {t("send.steps.recipient.namingService.reverse", {
                    domain: domainServiceResponse.domain,
                  })}
                </Text>
              </Box>
              <Box>
                <LinkWithExternalIcon
                  label={t("send.steps.recipient.namingService.supportLink")}
                  onClick={onSupportLinkClick}
                />
              </Box>
            </>
          )}
        </Alert>
      )}
    </>
  );
};

export default memo(RecipientField);
