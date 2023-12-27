import { useTheme } from "@react-navigation/native";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import React, { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Animated, SafeAreaView, StyleSheet, View } from "react-native";
import { useSelector } from "react-redux";
import Icon from "react-native-vector-icons/Feather";
import { getAccountCurrency, getAccountUnit } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { formatCurrencyUnit, getCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import type {
  APIGetPoolsDetail,
  StakePool,
} from "@ledgerhq/live-common/families/cardano/api/api-types";
import type {
  CardanoAccount,
  CardanoDelegation,
} from "@ledgerhq/live-common/families/cardano/types";
import { LEDGER_POOL_IDS } from "@ledgerhq/live-common/families/cardano/utils";
import { fetchPoolDetails } from "@ledgerhq/live-common/families/cardano/api/getPools";
import { Box, Text } from "@ledgerhq/native-ui";
import { AccountLike } from "@ledgerhq/types-live";
import { TransactionStatus } from "@ledgerhq/live-common/families/cardano/types";
import Button from "~/components/Button";
import Skeleton from "~/components/Skeleton";
import Circle from "~/components/Circle";
import CurrencyIcon from "~/components/CurrencyIcon";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import Touchable from "~/components/Touchable";
import LText from "~/components/LText";
import { accountScreenSelector } from "~/reducers/accounts";
import PoolImage from "../shared/PoolImage";
import { ScreenName } from "~/const";
import ArrowRight from "~/icons/ArrowRight";
import { TrackScreen } from "~/analytics";
import { rgba } from "../../../colors";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { CardanoDelegationFlowParamList } from "./types";
import TranslatedError from "~/components/TranslatedError";

type Props = StackNavigatorProps<
  CardanoDelegationFlowParamList,
  ScreenName.CardanoDelegationSummary
>;

export default function DelegationSummary({ navigation, route }: Props) {
  const { pool } = route.params;
  const { colors } = useTheme();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  invariant(account, "account must be defined");

  const { cardanoResources } = account as CardanoAccount;
  const currentDelegation = cardanoResources.delegation;
  const bridge = getAccountBridge(account, undefined);

  const [isFetchingPoolDetails, setIsFetchingPoolDetails] = useState(false);
  const [ledgerPools, setLedgerPools] = useState<Array<StakePool>>([]);

  useEffect(() => {
    if (LEDGER_POOL_IDS.includes(currentDelegation?.poolId ?? "")) {
      setIsFetchingPoolDetails(false);
      return;
    }

    if (account.type === "Account")
      fetchPoolDetails(account.currency, LEDGER_POOL_IDS)
        .then((apiRes: APIGetPoolsDetail) => {
          setLedgerPools(apiRes.pools);
        })
        .finally(() => {
          setIsFetchingPoolDetails(false);
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chosenPool = useMemo(() => {
    if (pool !== undefined) {
      return pool;
    }

    if (ledgerPools.length) {
      return ledgerPools[0];
    }

    return null;
  }, [ledgerPools, pool]);

  let tx = bridge.createTransaction(account);
  tx = bridge.updateTransaction(tx, { mode: "delegate" });

  const { transaction, updateTransaction, setTransaction, status, bridgePending, bridgeError } =
    useBridgeTransaction(() => {
      if (chosenPool) {
        tx = bridge.updateTransaction(tx, { poolId: chosenPool.poolId });
      }

      return { account, transaction: tx };
    });

  invariant(transaction, "transaction must be defined");
  invariant(transaction.family === "cardano", "transaction cardano");

  useEffect(() => {
    const tmpTransaction = route.params.transaction;
    if (tmpTransaction) {
      updateTransaction(_ => tmpTransaction);
    }

    if (chosenPool)
      setTransaction(
        bridge.updateTransaction(transaction, {
          mode: "delegate",
          poolId: chosenPool.poolId,
        }),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params, updateTransaction, bridge, setTransaction, chosenPool]);

  const onChangePool = useCallback(() => {
    navigation.navigate(ScreenName.CardanoDelegationPoolSelect, {
      ...route.params,
      transaction,
    });
  }, [navigation, transaction, route.params]);

  const currency = getAccountCurrency(account);
  const color = getCurrencyColor(currency);

  const onContinue = useCallback(async () => {
    navigation.navigate(ScreenName.CardanoDelegationSelectDevice, {
      accountId: account.id,
      parentId: parentAccount?.id || undefined,
      transaction,
      status,
    });
  }, [status, account, parentAccount, navigation, transaction]);

  const displayError = useMemo(() => {
    return status.errors.amount ? status.errors.amount : "";
  }, [status]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen category="DelegationFlow" name="Summary" />
      <View style={styles.body}>
        <View style={styles.delegatingAccount}>
          <Circle size={50} bg={rgba(color, 0.2)}>
            <CurrencyIcon size={32} currency={currency} />
          </Circle>
          <AccountBalanceTag account={account} />
        </View>

        <View style={styles.summary}>
          <SummaryWords
            currentDelegation={currentDelegation}
            onChangePool={onChangePool}
            isFetchingPoolDetails={isFetchingPoolDetails}
            chosenPool={chosenPool ?? undefined}
            account={account}
            status={status}
          />
        </View>
      </View>
      <View style={styles.footer}>
        {displayError ? (
          <Box>
            <Text fontSize={13} color="red">
              <TranslatedError error={displayError} field="title" />
            </Text>
          </Box>
        ) : (
          <></>
        )}
        <Button
          event="SummaryContinue"
          type="primary"
          title={<Trans i18nKey="common.continue" />}
          containerStyle={styles.continueButton}
          onPress={onContinue}
          disabled={
            !!displayError ||
            bridgePending ||
            !!bridgeError ||
            !chosenPool ||
            (currentDelegation && currentDelegation.poolId === chosenPool.poolId)
          }
          pending={bridgePending}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "column",
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: "space-around",
  },
  poolCircle: {
    borderWidth: 1,
    borderStyle: "dashed",
  },
  changeDelegator: {
    position: "absolute",
    right: -4,
    top: -4,
  },
  delegatingAccount: {
    paddingTop: 26,
    alignItems: "center",
  },
  accountBalanceTag: {
    marginTop: 8,
    borderRadius: 4,
    padding: 4,
    alignItems: "center",
  },
  accountBalanceTagText: {
    fontSize: 11,
  },
  accountName: {
    maxWidth: 180,
  },
  summary: {
    alignItems: "center",
    marginVertical: 30,
  },
  footer: {
    flexDirection: "column",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  continueButton: {
    alignSelf: "stretch",
    marginTop: 12,
  },
  // DataField
  summarySection: {
    flexDirection: "column",
    alignItems: "flex-start",
    width: "100%",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 5,
    width: "100%",
  },
  labelText: {
    paddingRight: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  valueWrapper: {
    alignItems: "flex-end",
  },
  valueText: {
    fontSize: 14,
  },
});

function SummaryWords({
  chosenPool,
  account,
  currentDelegation,
  isFetchingPoolDetails,
  onChangePool,
  status,
}: {
  chosenPool?: StakePool;
  account: AccountLike;
  currentDelegation?: CardanoDelegation;
  isFetchingPoolDetails: boolean;
  onChangePool: () => void;
  status: TransactionStatus;
}) {
  const unit = getAccountUnit(account);
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [rotateAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: -1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(1000),
      ]),
    ).start();
    return () => {
      rotateAnim.setValue(0);
    };
  }, [rotateAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "30deg"],
  });

  const formatConfig = {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
  };

  const toDelegationPoolData = useMemo(() => {
    return chosenPool
      ? [
          {
            label: t("cardano.delegation.cost"),
            Component: (
              <LText numberOfLines={1} semiBold ellipsizeMode="middle" style={[styles.valueText]}>
                {formatCurrencyUnit(
                  unit,
                  new BigNumber(chosenPool?.cost || new BigNumber(0)),
                  formatConfig,
                )}
              </LText>
            ),
          },
          {
            label: t("cardano.delegation.commission"),
            Component: (
              <LText semiBold ellipsizeMode="middle" style={[styles.valueText]}>
                {chosenPool?.margin + " %"}
              </LText>
            ),
          },
        ]
      : [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosenPool]);

  return (
    <>
      <View style={styles.summarySection}>
        {currentDelegation && currentDelegation.poolId && (
          <View style={[{ flexDirection: "column", marginBottom: 30 }]}>
            <View>
              <Text numberOfLines={1} fontWeight={"medium"} fontSize={14} color={"smoke"}>
                <Trans i18nKey={`cardano.delegation.delegatingFrom`} />
              </Text>
            </View>
            <View
              style={[
                {
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 15,
                  minWidth: "100%",
                },
              ]}
            >
              <Circle
                size={50}
                style={[styles.poolCircle, { borderColor: colors.primary, borderStyle: "solid" }]}
              >
                <PoolImage
                  size={LEDGER_POOL_IDS.includes(currentDelegation?.poolId) ? 40 : 50}
                  isLedger={LEDGER_POOL_IDS.includes(currentDelegation?.poolId)}
                  name={currentDelegation?.name ?? currentDelegation?.poolId}
                />
              </Circle>
              <Text
                style={[{ marginLeft: 15, flex: 1, flexGrow: 1 }]}
                numberOfLines={1}
                fontWeight={"semiBold"}
                ellipsizeMode="tail"
                fontSize={18}
              >
                {`${currentDelegation?.ticker} - ${currentDelegation?.name}`}
              </Text>
            </View>
          </View>
        )}
        <View style={[{ flexDirection: "column", marginBottom: 10 }]}>
          <View>
            <Text numberOfLines={1} fontWeight={"medium"} fontSize={14} color={"smoke"}>
              <Trans i18nKey={`cardano.delegation.delegatingTo`} />
            </Text>
          </View>

          {isFetchingPoolDetails ? (
            <Skeleton
              loading={true}
              animated={true}
              style={{
                marginTop: 10,
                height: 70,
                minWidth: "100%",
                borderRadius: 5,
              }}
            />
          ) : (
            <Touchable event="DelegationFlowSummaryChangeCircleBtn" onPress={onChangePool}>
              <View
                style={[
                  {
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 15,
                    minWidth: "100%",
                  },
                ]}
              >
                <Circle size={50} style={[styles.poolCircle, { borderColor: colors.primary }]}>
                  <Animated.View
                    style={{
                      transform: [
                        {
                          rotate,
                        },
                      ],
                    }}
                  >
                    {chosenPool ? (
                      <PoolImage
                        size={LEDGER_POOL_IDS.includes(chosenPool?.poolId) ? 40 : 50}
                        isLedger={LEDGER_POOL_IDS.includes(chosenPool?.poolId)}
                        name={chosenPool?.name ?? chosenPool?.poolId}
                      />
                    ) : (
                      <PoolImage size={50} isLedger={false} name={" "} />
                    )}
                  </Animated.View>
                  <Circle style={styles.changeDelegator} bg={colors.primary} size={26}>
                    <Icon size={13} name="edit-2" />
                  </Circle>
                </Circle>
                <Text
                  style={[{ marginLeft: 15, flex: 1, flexGrow: 1 }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  fontWeight={"semiBold"}
                  fontSize={18}
                >
                  {chosenPool
                    ? `${chosenPool?.ticker} - ${chosenPool?.name}`
                    : t("cardano.delegation.selectPool")}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginLeft: 10,
                  }}
                >
                  <LText style={{ fontSize: 14 }} color="live">
                    {chosenPool ? t("cardano.delegation.change") : t("cardano.delegation.select")}
                  </LText>
                  <ArrowRight color={colors.live} size={14} />
                </View>
              </View>
            </Touchable>
          )}
        </View>
        {toDelegationPoolData.map((field, i) => (
          <DataField {...field} key={"data-" + i} />
        ))}
        <View
          style={[
            {
              borderBottomWidth: 1,
              borderBottomColor: colors.lightFog,
              width: "100%",
              marginVertical: 10,
            },
          ]}
        />
        <DataField
          label={t("cardano.delegation.networkFees")}
          Component={
            <LText numberOfLines={1} semiBold ellipsizeMode="middle" style={[styles.valueText]}>
              {formatCurrencyUnit(unit, new BigNumber(status.estimatedFees), formatConfig)}
            </LText>
          }
        />
        {!(currentDelegation && currentDelegation.poolId) ? (
          <DataField
            label={t("cardano.delegation.stakeKeyRegistrationDeposit")}
            Component={
              <LText numberOfLines={1} semiBold ellipsizeMode="middle" style={[styles.valueText]}>
                {formatCurrencyUnit(
                  unit,
                  new BigNumber(
                    (account as CardanoAccount).cardanoResources.protocolParams.stakeKeyDeposit,
                  ),
                  formatConfig,
                )}
              </LText>
            }
          />
        ) : (
          <></>
        )}
      </View>
    </>
  );
}

const AccountBalanceTag = ({ account }: { account: AccountLike }) => {
  const unit = getAccountUnit(account);
  const { colors } = useTheme();
  return (
    <View style={[styles.accountBalanceTag, { backgroundColor: colors.border }]}>
      <Text
        fontWeight="semiBold"
        numberOfLines={1}
        style={styles.accountBalanceTagText}
        color="smoke"
      >
        <CurrencyUnitValue showCode unit={unit} value={account.balance} />
      </Text>
    </View>
  );
};

type FieldType = {
  label: ReactNode;
  Component: ReactNode;
};

function DataField({ label, Component }: FieldType) {
  return (
    <View style={styles.row}>
      <View>
        <LText numberOfLines={1} style={styles.labelText} color="smoke">
          {label}
        </LText>
      </View>

      <View style={styles.valueWrapper}>{Component}</View>
    </View>
  );
}
