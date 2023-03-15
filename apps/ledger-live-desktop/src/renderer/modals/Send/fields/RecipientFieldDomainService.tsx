import React, { memo, useCallback, useEffect, useMemo } from "react";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { Account, AccountBridge } from "@ledgerhq/types-live";
import { TFunction } from "react-i18next";

import { useDomain } from "@ledgerhq/domain-service/hooks/index";
import { isLoaded } from "@ledgerhq/domain-service/hooks/logic";

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

const RecipientFieldDomainService = ({
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
  const onSupportLinkClick = useCallback(() => openURL(urls.ens), []);

  const domainServiceResponse = useDomain(value, "ens");
  const ensResolution = useMemo(
    () => (isLoaded(domainServiceResponse) ? domainServiceResponse.resolutions[0] : null),
    [domainServiceResponse],
  );

  const lowerCaseValue = useMemo(() => value.toLowerCase(), [value]);
  const isForwardResolution = useMemo(
    () => !!lowerCaseValue && lowerCaseValue === ensResolution?.domain,
    [ensResolution?.domain, lowerCaseValue],
  );

  useEffect(() => {
    const { recipient, recipientDomain } = transaction;

    if (!ensResolution) {
      // without ENS resolution transaction recipient should always be the user's input
      const recipientUpdated = recipient === value;
      // without ENS resolution transaction domain should be undefined
      const hasDomain = !!recipientDomain;
      if (!recipientUpdated || hasDomain) {
        onChangeTransaction(
          bridge.updateTransaction(transaction, {
            recipient: value,
            recipientDomain: undefined,
          }),
        );
      }
      return;
    }

    // verify if domain is present in transaction
    const domainSet = recipientDomain === ensResolution;
    const recipientSet = isForwardResolution
      ? // if user's input is a domain, verify that we set the resolution's address as tx recipient
        recipient === ensResolution?.address
      : // if user's input is an address, keep the user's input as tx recipient
        recipient === value;
    if (!domainSet || !recipientSet) {
      onChangeTransaction(
        bridge.updateTransaction(transaction, {
          recipient: isForwardResolution ? ensResolution.address : value,
          recipientDomain: ensResolution,
        }),
      );
    }
  }, [bridge, onChangeTransaction, ensResolution, transaction, isForwardResolution, value]);

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
      {transaction.recipientDomain && (
        <Alert mt={5}>
          {isForwardResolution ? (
            <>
              <Box>
                <Text ff="Inter" fontSize={3}>
                  {t("send.steps.recipient.namingService.resolve")}
                </Text>
              </Box>
              <Box>
                <Text ff="Inter|SemiBold" fontSize={3}>
                  {transaction.recipientDomain.address}
                </Text>
              </Box>
            </>
          ) : (
            <>
              <Box>
                <Text ff="Inter" fontSize={3}>
                  {t("send.steps.recipient.namingService.reverse", {
                    domain: transaction.recipientDomain.domain,
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

export default memo(RecipientFieldDomainService);
