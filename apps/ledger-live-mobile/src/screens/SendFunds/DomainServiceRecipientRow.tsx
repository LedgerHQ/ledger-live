import React, { memo, useCallback, useEffect, useMemo } from "react";
import { Linking, Platform, StyleSheet, View } from "react-native";
import Clipboard from "@react-native-community/clipboard";
import { useDomain } from "@ledgerhq/domain-service/hooks/index";
import { isLoaded } from "@ledgerhq/domain-service/hooks/logic";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/impl";
import { Trans } from "react-i18next";
import RecipientInput from "../../components/RecipientInput";
import Alert from "../../components/Alert";
import ExternalLink from "../../components/ExternalLink";
import { urls } from "../../config/urls";
import TranslatedError from "../../components/TranslatedError";
import LText from "../../components/LText";
import SupportLinkError from "../../components/SupportLinkError";

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
  const ensResolution = useMemo(
    () =>
      isLoaded(domainServiceResponse)
        ? domainServiceResponse.resolutions[0]
        : null,
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
  }, [
    bridge,
    setTransaction,
    ensResolution,
    transaction,
    isForwardResolution,
    value,
  ]);

  const domainServiceSupportLink = useCallback(() => {
    Linking.openURL(urls.domainService);
  }, []);

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
          // FIXME: onInputCleared PROP DOES NOT EXISTS
          // onInputCleared={clear}
          value={value}
        />
      </View>

      {(error || warning) && (
        <>
          <LText
            style={[styles.warningBox]}
            color={error ? "alert" : warning ? "orange" : "darkBlue"}
          >
            <TranslatedError error={error || warning} />
          </LText>
          <View
            style={{
              display: "flex",
              alignItems: "flex-start",
            }}
          >
            <SupportLinkError error={error} type="alert" />
          </View>
        </>
      )}

      {transaction.recipientDomain && (
        <View style={styles.inputWrapper}>
          {isForwardResolution ? (
            <Alert type="success">
              <Trans i18nKey="send.recipient.domainService.forward" />
            </Alert>
          ) : (
            <Alert type="success">
              <Trans
                i18nKey="send.recipient.domainService.reverse"
                values={{ domain: transaction.recipientDomain.domain }}
              />
              <ExternalLink
                onPress={domainServiceSupportLink}
                text={
                  <Trans i18nKey="send.recipient.domainService.supportLink" />
                }
              />
            </Alert>
          )}
        </View>
      )}
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
