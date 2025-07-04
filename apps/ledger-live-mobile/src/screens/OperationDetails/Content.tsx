import React, { useCallback, useState } from "react";
import { View, StyleSheet, Linking } from "react-native";
import uniq from "lodash/uniq";
import { useSelector } from "react-redux";
import { Trans, useTranslation } from "react-i18next";
import { useNavigation, useTheme } from "@react-navigation/native";
import type { Account, Operation, AccountLike, NFTMetadataResponse } from "@ledgerhq/types-live";
import { getFeesCurrency, getFeesUnit } from "@ledgerhq/live-common/account/index";
import {
  getOperationAmountNumber,
  isConfirmedOperation,
  getOperationConfirmationDisplayableNumber,
  isEditableOperation,
  isStuckOperation,
} from "@ledgerhq/live-common/operation";
import { useNftCollectionMetadata, useNftMetadata } from "@ledgerhq/live-nft-react";
import { NFTResource } from "@ledgerhq/live-nft/types";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { NavigatorName, ScreenName } from "~/const";
import LText from "~/components/LText";
import OperationIcon from "~/components/OperationIcon";
import OperationRow from "~/components/OperationRow";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import CounterValue from "~/components/CounterValue";
import Touchable from "~/components/Touchable";
import { urls } from "~/utils/urls";
import Info from "~/icons/Info";
import ExternalLink from "~/icons/ExternalLink";
import { currencySettingsForAccountSelector } from "~/reducers/settings";
import DataList from "./DataList";
import Modal from "./Modal";
import Section, { styles as sectionStyles } from "./Section";
import byFamiliesOperationDetails from "../../generated/operationDetails";
import byFamiliesEditOperationPanel from "../../generated/EditOperationPanel";
import DefaultOperationDetailsExtra from "./Extra";
import Skeleton from "~/components/Skeleton";
import type { State } from "~/reducers/types";
import Title from "./Title";
import FormatDate from "~/components/DateFormat/FormatDate";
import type {
  RootNavigationComposite,
  StackNavigatorNavigation,
} from "~/components/RootNavigator/types/helpers";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { useAccountName } from "~/reducers/wallet";
import { useAccountUnit } from "~/hooks/useAccountUnit";

type HelpLinkProps = {
  event: string;
  title: React.ReactNode;
  onPress: () => Promise<void> | null | undefined;
};

const HelpLink = ({ title, event, onPress }: HelpLinkProps) => {
  const { colors } = useTheme();
  return (
    <Touchable onPress={onPress} event={event} style={styles.helpLinkRoot}>
      <ExternalLink size={12} color={colors.smoke} />
      <LText style={styles.helpLinkText} color="smoke">
        {title}
      </LText>
    </Touchable>
  );
};

type Props = {
  account: AccountLike;
  parentAccount?: Account | null;
  operation: Operation;
  disableAllLinks?: boolean;
  currency: CryptoCurrency | TokenCurrency;
  mainAccount: Account;
};

export default function Content({
  account,
  mainAccount,
  parentAccount,
  operation,
  disableAllLinks,
  currency,
}: Props) {
  const { colors } = useTheme();
  const navigation =
    useNavigation<RootNavigationComposite<StackNavigatorNavigation<BaseNavigatorStackParamList>>>();
  const { t } = useTranslation();
  const [isModalOpened, setIsModalOpened] = useState(false);

  const onPress = useCallback(() => {
    navigation.navigate(NavigatorName.Accounts, {
      screen: ScreenName.Account,
      params: {
        accountId: account.id,
        parentId: parentAccount?.id,
      },
    });
  }, [account.id, navigation, parentAccount]);

  const onPressInfo = useCallback(() => {
    setIsModalOpened(true);
  }, []);

  const onModalClose = useCallback(() => {
    setIsModalOpened(false);
  }, []);

  const currencySettings = useSelector((s: State) =>
    currencySettingsForAccountSelector(s.settings, {
      account: mainAccount,
    }),
  );

  const isToken = currency.type === "TokenCurrency";
  const accountName = useAccountName(account);
  const unit = useAccountUnit(account);
  const feeCurrency = getFeesCurrency(mainAccount);
  const feeUnit = getFeesUnit(feeCurrency);
  const amount = getOperationAmountNumber(operation);
  const isNegative = amount.isNegative();
  const confirmationsString = getOperationConfirmationDisplayableNumber(operation, mainAccount);
  const uniqueSenders = uniq<(typeof operation.senders)[0]>(operation.senders);
  const uniqueRecipients = uniq<(typeof operation.recipients)[0]>(operation.recipients);
  const { type, hasFailed } = operation;
  const subOperations = operation.subOperations || [];
  const internalOperations = operation.internalOperations || [];
  const shouldDisplayTo = uniqueRecipients.length > 0 && !!uniqueRecipients[0];

  const isConfirmed = isConfirmedOperation(
    operation,
    mainAccount,
    currencySettings.confirmationsNb,
  );

  const isEditable = isEditableOperation({ account: mainAccount, operation });
  const isOperationStuck = isStuckOperation({ family: mainAccount.currency.family, operation });

  const specificOperationDetails =
    byFamiliesOperationDetails[
      mainAccount.currency.family as keyof typeof byFamiliesOperationDetails
    ];

  const { EditOperationPanel: SpecificEditOperationPanel = undefined } =
    byFamiliesEditOperationPanel[
      mainAccount.currency.family as keyof typeof byFamiliesEditOperationPanel
    ] || {};

  const urlFeesInfo =
    specificOperationDetails &&
    (specificOperationDetails as { getURLFeesInfo: (o: Operation, c: string) => string })
      ?.getURLFeesInfo &&
    (
      specificOperationDetails as { getURLFeesInfo: (o: Operation, c: string) => string }
    )?.getURLFeesInfo(operation, mainAccount.currency.id);

  const Extra =
    specificOperationDetails &&
    (specificOperationDetails as { OperationDetailsExtra: React.ComponentType })
      .OperationDetailsExtra
      ? (
          specificOperationDetails as {
            OperationDetailsExtra: React.ComponentType<{
              type: typeof type;
              account: AccountLike;
              operation: Operation;
            }>;
          }
        ).OperationDetailsExtra
      : DefaultOperationDetailsExtra;

  const isNftOperation =
    ["NFT_IN", "NFT_OUT"].includes(type) && operation.contract && operation.tokenId;
  const { status: collectionStatus, metadata: collectionMetadata } = useNftCollectionMetadata(
    operation.contract,
    mainAccount.currency.id,
  );
  const { status: nftStatus, metadata: nftMetadata } = useNftMetadata(
    operation.contract,
    operation.tokenId,
    mainAccount.currency.id,
  ) as NFTResource & {
    metadata: NFTMetadataResponse["result"];
  };

  return (
    <>
      <View style={styles.header}>
        <View style={styles.icon}>
          <OperationIcon
            size={57}
            operation={operation}
            account={account}
            parentAccount={parentAccount}
          />
        </View>

        <Title
          hasFailed={!!hasFailed}
          isConfirmed={isConfirmed}
          amount={amount}
          operation={operation}
          currency={currency}
          unit={unit}
          isNftOperation={!!isNftOperation}
          status={nftStatus}
          metadata={nftMetadata}
          styles={styles}
        />
        <View style={styles.confirmationContainer}>
          <View
            style={[
              styles.bulletPoint,
              {
                backgroundColor: hasFailed
                  ? colors.alert
                  : isConfirmed
                    ? colors.green
                    : colors.grey,
              },
            ]}
          />
          {hasFailed ? (
            <LText
              style={[
                styles.confirmation,
                {
                  color: colors.alert,
                },
              ]}
            >
              <Trans i18nKey="operationDetails.failed" />
            </LText>
          ) : isConfirmed ? (
            <LText
              testID="operation-details-text-confirmed"
              semiBold
              style={[
                styles.confirmation,
                {
                  color: colors.green,
                },
              ]}
            >
              <Trans i18nKey="operationDetails.confirmed" />{" "}
              {confirmationsString && `(${confirmationsString})`}
            </LText>
          ) : (
            <LText
              style={[
                styles.confirmation,
                {
                  color: colors.grey,
                },
              ]}
            >
              <Trans i18nKey="operationDetails.notConfirmed" />{" "}
              {confirmationsString && `(${confirmationsString})`}
            </LText>
          )}
        </View>
      </View>

      {subOperations.length > 0 && account.type === "Account" && (
        <>
          <View style={[sectionStyles.wrapper]}>
            <LText color="grey" semiBold>
              <Trans
                i18nKey={
                  isToken
                    ? "operationDetails.tokenOperations"
                    : "operationDetails.subAccountOperations"
                }
              />
            </LText>
            {isToken ? (
              <Touchable style={styles.info} onPress={onPressInfo} event="TokenOperationsInfo">
                <Info size={12} color={colors.grey} />
              </Touchable>
            ) : null}
          </View>
          {subOperations.map((op, i) => {
            const opAccount = (account.subAccounts || []).find(acc => acc.id === op.accountId);
            if (!opAccount) return null;
            return (
              <View
                key={op.id}
                style={{
                  marginHorizontal: 16,
                }}
              >
                <OperationRow
                  isSubOperation
                  operation={op}
                  parentAccount={account}
                  account={opAccount}
                  multipleAccounts
                  isLast={subOperations.length - 1 === i}
                />
              </View>
            );
          })}
        </>
      )}

      {internalOperations.length > 0 && account.type === "Account" && (
        <>
          <Section title={t("operationDetails.internalOperations")} />
          {internalOperations.map((op, i) => (
            <OperationRow
              key={op.id}
              operation={op}
              parentAccount={null}
              account={account}
              multipleAccounts
              isLast={internalOperations.length - 1 === i}
            />
          ))}
        </>
      )}

      {internalOperations.length > 0 || subOperations.length > 0 ? (
        <Section
          title={t("operationDetails.details", {
            currency: currency.name,
          })}
        />
      ) : null}

      {isEditable && SpecificEditOperationPanel ? (
        <SpecificEditOperationPanel
          isOperationStuck={isOperationStuck}
          account={account}
          parentAccount={parentAccount}
          operation={operation}
        />
      ) : null}

      {!disableAllLinks ? (
        <Section
          title={t("operationDetails.account")}
          value={accountName}
          onPress={onPress}
          testID="operationDetails-account"
        />
      ) : null}

      {isNftOperation ? (
        <>
          <Section title={t("operationDetails.tokenName")}>
            <Skeleton style={styles.tokenNameSkeleton} loading={collectionStatus === "loading"}>
              <LText semiBold>{collectionMetadata?.tokenName || "-"}</LText>
            </Skeleton>
          </Section>
          <Section title={t("operationDetails.collectionContract")} value={operation.contract} />
          <Section title={t("operationDetails.tokenId")} value={operation.tokenId} />
          {operation.standard === "ERC1155" && (
            <Section title={t("operationDetails.quantity")} value={operation.value.toFixed()} />
          )}
        </>
      ) : null}

      <Section
        title={t("operationDetails.date")}
        testID="operationDetails-date"
        value={<FormatDate withHoursMinutes date={operation.date} />}
      />

      {isNegative || operation.fee ? (
        <Section
          title={t("operationDetails.fees")}
          headerRight={
            urlFeesInfo ? (
              <View>
                <HelpLink
                  event="MultipleAddressesSupport"
                  onPress={() => Linking.openURL(urls.multipleAddresses)}
                  title={t("common.learnMore")}
                />
              </View>
            ) : undefined
          }
        >
          {operation.fee ? (
            <View style={styles.feeValueContainer}>
              <LText style={sectionStyles.value} semiBold testID="operationDetails-fees">
                <CurrencyUnitValue showCode unit={feeUnit} value={operation.fee} />
              </LText>
              <LText style={styles.feeCounterValue} color="smoke" semiBold>
                ≈
              </LText>
              <LText style={styles.feeCounterValue} color="smoke" semiBold>
                <CounterValue
                  showCode
                  disableRounding={true}
                  date={operation.date}
                  subMagnitude={1}
                  currency={feeCurrency}
                  value={operation.fee}
                />
              </LText>
            </View>
          ) : (
            <LText style={sectionStyles.value} semiBold>
              {t("operationDetails.noFees")}
            </LText>
          )}
        </Section>
      ) : null}

      <Section
        title={t("operationDetails.identifier")}
        value={operation.hash}
        testID="operationDetails-identifier"
      />

      {uniqueSenders.length > 0 && (
        <View style={sectionStyles.wrapper}>
          <DataList
            testID="operationDetails-sender"
            data={uniqueSenders}
            title={<Trans i18nKey="operationDetails.from" />}
          />
        </View>
      )}

      {shouldDisplayTo ? (
        <View style={sectionStyles.wrapper}>
          <DataList
            data={uniqueRecipients}
            title={<Trans i18nKey="operationDetails.to" />}
            testID="operationDetails-recipient"
            rightComp={
              uniqueRecipients.length > 1 ? (
                <View
                  style={{
                    marginLeft: "auto",
                  }}
                >
                  <HelpLink
                    event="MultipleAddressesSupport"
                    onPress={() => Linking.openURL(urls.multipleAddresses)}
                    title={<Trans i18nKey="operationDetails.multipleAddresses" />}
                  />
                </View>
              ) : null
            }
          />
        </View>
      ) : null}

      <Extra operation={operation} type={type} account={account} />

      <Modal isOpened={isModalOpened} onClose={onModalClose} currency={currency} />
    </>
  );
}
const styles = StyleSheet.create({
  root: {
    borderBottomWidth: 1,
    borderColor: "#eee",
    paddingTop: 20,
    maxHeight: 550,
  },
  header: {
    alignItems: "center",
  },
  icon: {
    marginBottom: 16,
  },
  feeValueContainer: {
    flexDirection: "row",
  },
  feeCounterValue: {
    marginLeft: 16,
  },
  currencyUnitValueSkeleton: {
    height: 24,
    width: 250,
    borderRadius: 4,
  },
  currencyUnitValue: {
    paddingHorizontal: 8,
    fontSize: 20,
    marginBottom: 8,
  },
  titleTokenId: {
    paddingHorizontal: 30,
    fontSize: 16,
    marginBottom: 16,
  },
  counterValue: {
    fontSize: 14,
    marginBottom: 16,
  },
  confirmationContainer: {
    flexDirection: "row",
    marginBottom: 24,
    justifyContent: "center",
  },
  confirmation: {
    fontSize: 16,
  },
  info: {
    marginLeft: 5,
  },
  bulletPoint: {
    borderRadius: 50,
    height: 6,
    width: 6,
    marginRight: 8,
    alignSelf: "center",
  },
  helpLinkRoot: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  helpLinkText: {
    marginLeft: 5,
    fontSize: 12,
    textDecorationLine: "underline",
  },
  tokenNameSkeleton: {
    height: 17,
    width: 250,
    borderRadius: 4,
  },
});
