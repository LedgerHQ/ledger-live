import React, { memo, useEffect, useMemo, useState } from "react";
import { getRegistriesForDomain } from "@ledgerhq/domain-service/registries/index";
import { isError, isLoaded } from "@ledgerhq/domain-service/hooks/logic";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/impl";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { useDomain } from "@ledgerhq/domain-service/hooks/index";
import { Platform, StyleSheet, View } from "react-native";
import { Account, AccountLike } from "@ledgerhq/types-live";
import Clipboard from "@react-native-clipboard/clipboard";
import { InvalidDomain, NoResolution } from "@ledgerhq/domain-service/errors/index";
import { Trans } from "react-i18next";
import { BasicErrorsView, DomainErrorsView } from "./DomainErrorHandlers";
import RecipientInput from "~/components/RecipientInput";
import Alert from "~/components/Alert";
import { urls } from "~/utils/urls";

type Props = {
  onChangeText: (value: string) => void;
  value: string;
  onRecipientFieldFocus: () => void;
  account: AccountLike;
  parentAccount?: Account | null;
  transaction: Transaction;
  setTransaction: (t: Transaction) => void;
  warning?: Error | null;
  error?: Error | null;
};

const DomainServiceRecipientInput = ({
  onChangeText,
  value,
  onRecipientFieldFocus,
  transaction,
  setTransaction,
  account,
  parentAccount,
  warning,
  error,
}: Props) => {
  const bridge = getAccountBridge(account, parentAccount);

  const domainServiceResponse = useDomain(value, "ens");
  const lowerCaseValue = useMemo(() => value.toLowerCase(), [value]);

  const ensResolution = useMemo(
    () => (isLoaded(domainServiceResponse) ? domainServiceResponse.resolutions[0] : null),
    [domainServiceResponse],
  );
  const domainError = useMemo(
    () => (isError(domainServiceResponse) ? domainServiceResponse : null),
    [domainServiceResponse],
  );
  const domainErrorHandled = useMemo(
    () =>
      (domainError?.error as Error) instanceof InvalidDomain ||
      (domainError?.error as Error) instanceof NoResolution,
    [domainError],
  );

  const [isForwardResolution, setIsForwardResolution] = useState(false);
  useEffect(() => {
    // if a registry compatible with the input is found, then we know the input is a domain
    getRegistriesForDomain(lowerCaseValue).then(registries =>
      setIsForwardResolution(Boolean(registries.length)),
    );
  }, [lowerCaseValue]);

  useEffect(() => {
    const { recipient, recipientDomain } = transaction;

    if (!ensResolution) {
      // without ENS resolution transaction recipient should always be the user's input
      const recipientUpdated = recipient === value;
      // without ENS resolution transaction domain should be undefined
      const hasDomain = !!recipientDomain;
      if (!recipientUpdated || hasDomain) {
        setTransaction(
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
      setTransaction(
        bridge.updateTransaction(transaction, {
          recipient: isForwardResolution ? ensResolution.address : value,
          recipientDomain: ensResolution,
        }),
      );
    }
  }, [bridge, setTransaction, ensResolution, transaction, isForwardResolution, value]);

  return (
    <>
      <View style={styles.inputWrapper}>
        <RecipientInput
          onPaste={async () => {
            const text = await Clipboard.getString();
            onChangeText(text);
          }}
          onFocus={onRecipientFieldFocus}
          onChangeText={onChangeText}
          value={value}
          placeholderTranslationKey="transfer.recipient.inputEns"
        />
      </View>

      <BasicErrorsView
        error={error}
        warning={warning}
        domainError={domainError}
        domainErrorHandled={domainErrorHandled}
        isForwardResolution={isForwardResolution}
      />

      {transaction.recipientDomain && (
        <View style={styles.inputWrapper}>
          {isForwardResolution ? (
            <Alert type="success">
              <Trans i18nKey="send.recipient.domainService.forward" />
            </Alert>
          ) : (
            <Alert
              type="success"
              learnMoreUrl={urls.domainService}
              learnMoreKey="send.recipient.domainService.supportLink"
            >
              <Trans
                i18nKey="send.recipient.domainService.reverse"
                values={{ domain: transaction.recipientDomain.domain }}
              />
            </Alert>
          )}
        </View>
      )}

      {domainError && domainErrorHandled ? (
        <View style={styles.inputWrapper}>
          <DomainErrorsView domainError={domainError} isForwardResolution={isForwardResolution} />
        </View>
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  warningBox: {
    marginTop: 8,
    ...Platform.select({
      android: {
        marginLeft: 6,
      },
    }),
  },
  inputWrapper: {
    marginTop: 32,
    flexDirection: "row",
    alignItems: "center",
  },
});

export default memo(DomainServiceRecipientInput);
