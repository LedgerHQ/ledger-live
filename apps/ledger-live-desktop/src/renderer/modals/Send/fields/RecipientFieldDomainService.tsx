import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { InvalidDomain, NoResolution } from "@ledgerhq/domain-service/errors/index";
import { getRegistriesForDomain } from "@ledgerhq/domain-service/registries/index";
import { isLoaded, isError } from "@ledgerhq/domain-service/hooks/logic";
import { useDomain } from "@ledgerhq/domain-service/hooks/index";
import { Account, AccountBridge } from "@ledgerhq/types-live";
import { TFunction } from "react-i18next";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import { DomainErrorsView } from "./DomainErrorHandlers";
import RecipientFieldBase from "./RecipientFieldBase";
import Alert from "~/renderer/components/Alert";
import Text from "~/renderer/components/Text";
import { openURL } from "~/renderer/linking";
import Box from "~/renderer/components/Box";
import { urls } from "~/config/urls";
import { OnChangeExtra } from "~/renderer/components/RecipientAddress";

type Props<T extends Transaction, TS extends TransactionStatus> = {
  account: Account;
  transaction: T;
  autoFocus?: boolean;
  status: TS;
  onChangeTransaction: (tx: T) => void;
  t: TFunction;
  label?: React.ReactNode;
  initValue?: string;
  resetInitValue?: () => void;
  value: string | string;
  bridge: AccountBridge<T>;
  onChange: (recipient: string, maybeExtra?: OnChangeExtra | null) => void;
};

const RecipientFieldDomainService = <T extends Transaction, TS extends TransactionStatus>({
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
}: Props<T, TS>) => {
  const onSupportLinkClick = useCallback(() => openURL(urls.ens), []);

  const domainServiceResponse = useDomain(value, "ens");
  const ensResolution = useMemo(
    () => (isLoaded(domainServiceResponse) ? domainServiceResponse.resolutions[0] : null),
    [domainServiceResponse],
  );
  const domainError = useMemo(
    () => (isError(domainServiceResponse) ? domainServiceResponse : null),
    [domainServiceResponse],
  );

  const lowerCaseValue = useMemo(() => value.toLowerCase(), [value]);

  const [isForwardResolution, setIsForwardResolution] = useState(false);
  useEffect(() => {
    // if a registry compatible with the input is found, then we know the input is a domain
    getRegistriesForDomain(lowerCaseValue).then(registries =>
      setIsForwardResolution(Boolean(registries.length)),
    );
  }, [lowerCaseValue]);

  const domainErrorHandled = useMemo(() => {
    if (domainError) {
      if (!isForwardResolution && domainError.error instanceof NoResolution) {
        return false;
      }

      if (
        (domainError.error as Error) instanceof NoResolution ||
        (domainError.error as Error) instanceof InvalidDomain
      ) {
        return true;
      }
    }
    return false;
  }, [domainError, isForwardResolution]);

  useEffect(() => {
    const { recipient, recipientDomain } = transaction;

    if (!ensResolution) {
      // without ENS resolution transaction recipient should always be the user's input
      const recipientUpdated = recipient === value;
      // without ENS resolution transaction domain should be undefined
      const hasDomain = !!recipientDomain;
      if (!recipientUpdated || hasDomain) {
        onChangeTransaction(
          // @ts-expect-error blockchain team must move this global component back to Ethereum world. it doesn't exist in the generic Transaction type
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
        // @ts-expect-error blockchain team must move this global component back to Ethereum world. it doesn't exist in the generic Transaction type
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
        placeholderTranslationKey="RecipientField.placeholderEns"
        hideError={domainErrorHandled}
      />
      {transaction.recipientDomain ? (
        <Alert mt={5}>
          {isForwardResolution ? (
            <>
              <Box>
                <Text ff="Inter" fontSize={3}>
                  {t("send.steps.recipient.domainService.resolve")}
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
                  {t("send.steps.recipient.domainService.reverse", {
                    domain: transaction.recipientDomain.domain,
                  })}
                </Text>
              </Box>
              <Box>
                <LinkWithExternalIcon
                  label={t("send.steps.recipient.domainService.supportLink")}
                  onClick={onSupportLinkClick}
                />
              </Box>
            </>
          )}
        </Alert>
      ) : null}
      {domainError ? (
        <DomainErrorsView domainError={domainError} isForwardResolution={isForwardResolution} />
      ) : null}
    </>
  );
};

export default memo(RecipientFieldDomainService) as typeof RecipientFieldDomainService;
