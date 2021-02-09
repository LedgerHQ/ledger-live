// @flow
import invariant from "invariant";
import React, { useCallback, useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SectionList,
  Linking,
} from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { Trans, useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useTheme } from "@react-navigation/native";
import { Polkadot as PolkadotIdenticon } from "@polkadot/reactnative-identicon/icons";

import type {
  Transaction,
  PolkadotValidator,
} from "@ledgerhq/live-common/lib/families/polkadot/types";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import { getMainAccount } from "@ledgerhq/live-common/lib/account";
import {
  getDefaultExplorerView,
  getAddressExplorer,
} from "@ledgerhq/live-common/lib/explorers";
import useBridgeTransaction from "@ledgerhq/live-common/lib/bridge/useBridgeTransaction";
import { MAX_NOMINATIONS } from "@ledgerhq/live-common/lib/families/polkadot/logic";
import { PolkadotValidatorsRequired } from "@ledgerhq/live-common/lib/families/polkadot/errors";
import {
  usePolkadotPreloadData,
  useSortedValidators,
} from "@ledgerhq/live-common/lib/families/polkadot/react";

import { accountScreenSelector } from "../../../reducers/accounts";
import { NavigatorName, ScreenName } from "../../../const";
import Button from "../../../components/Button";
import SelectValidatorSearchBox from "../../tron/VoteFlow/01-SelectValidator/SearchBox";
import LText from "../../../components/LText";
import WarningBox from "../../../components/WarningBox";
import TranslatedError from "../../../components/TranslatedError";
import Check from "../../../icons/Check";

import { getFirstStatusError } from "../../helpers";

import FlowErrorBottomModal from "../components/FlowErrorBottomModal";
import NominationDrawer from "../components/NominationDrawer";
import SendRowsFee from "../SendRowsFee";
import ValidatorItem from "./ValidatorItem";
import { getDrawerInfo } from "./drawerInfo";

type RouteParams = {
  accountId: string,
  transaction: Transaction,
  fromSelectAmount?: true,
};

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

function NominateSelectValidator({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));

  invariant(account, "account required");

  const mainAccount = getMainAccount(account, parentAccount);
  const bridge = getAccountBridge(account, parentAccount);

  const [drawerValidator, setDrawerValidator] = useState<?PolkadotValidator>();

  const { polkadotResources } = mainAccount;

  invariant(polkadotResources, "polkadotResources required");

  const {
    transaction,
    setTransaction,
    status,
    bridgePending,
    bridgeError,
  } = useBridgeTransaction(() => {
    const tx = route.params.transaction;

    if (!tx) {
      const t = bridge.createTransaction(mainAccount);

      const initialValidators = (
        mainAccount.polkadotResources?.nominations || []
      )
        .filter(nomination => !!nomination.status)
        .map(nomination => nomination.address);

      return {
        account,
        transaction: bridge.updateTransaction(t, {
          mode: "nominate",
          validators: initialValidators,
        }),
      };
    }

    return { account, transaction: tx };
  });

  invariant(
    transaction && transaction.validators,
    "transaction and validators required",
  );

  const [searchQuery, setSearchQuery] = useState("");

  const validators = useMemo(() => transaction.validators || [], [
    transaction.validators,
  ]);

  const nominations = useMemo(() => polkadotResources.nominations || [], [
    polkadotResources.nominations,
  ]);

  // Addresses that are no longer validators
  const nonValidators = useMemo(
    () =>
      (polkadotResources.nominations || [])
        .filter(nomination => !nomination.status)
        .map(nomination => nomination.address),
    [polkadotResources.nominations],
  );

  const { staking, validators: polkadotValidators } = usePolkadotPreloadData();
  const maxNominatorRewardedPerValidator =
    staking?.maxNominatorRewardedPerValidator || 300;

  const sorted = useSortedValidators(
    searchQuery,
    polkadotValidators,
    nominations,
  );

  const sections = useMemo(
    () =>
      sorted
        .reduce(
          (data, validator) => {
            const isNominated = nominations.some(
              n => n.address === validator.address,
            );
            if (isNominated) {
              data[0].data.push(validator);
            } else if (validator.isElected) {
              data[1].data.push(validator);
            } else {
              data[2].data.push(validator);
            }
            return data;
          },
          [
            {
              title: (
                <Trans i18nKey="polkadot.nominate.steps.validators.myNominations" />
              ),
              data: [],
            },
            {
              title: (
                <Trans i18nKey="polkadot.nominate.steps.validators.electedValidators" />
              ),
              data: [],
            },
            {
              title: (
                <Trans i18nKey="polkadot.nominate.steps.validators.waitingValidators" />
              ),
              data: [],
            },
          ],
        )
        .filter(({ data }) => data.length > 0),
    [sorted, nominations],
  );

  const onNext = useCallback(() => {
    setDrawerValidator();
    navigation.navigate(ScreenName.PolkadotNominateSelectDevice, {
      ...route.params,
      transaction,
      status,
    });
  }, [navigation, route.params, transaction, status]);

  const onSelect = useCallback(
    (validator, selected) => {
      setDrawerValidator();
      const newValidators = selected
        ? validators.filter(v => v !== validator.address)
        : [...validators, validator.address];
      const tx = bridge.updateTransaction(transaction, {
        validators: newValidators,
      });
      setTransaction(tx);
    },
    [bridge, setTransaction, transaction, validators],
  );

  const onOpenExplorer = useCallback(
    (address: string) => {
      const url = getAddressExplorer(
        getDefaultExplorerView(mainAccount.currency),
        address,
      );
      if (url) Linking.openURL(url);
    },
    [mainAccount.currency],
  );

  const onOpenDrawer = useCallback(
    address => {
      const validator = polkadotValidators.find(v => v.address === address);

      setDrawerValidator(validator);
    },
    [polkadotValidators],
  );

  const onCloseDrawer = useCallback(() => {
    setDrawerValidator();
  }, []);

  const onGoToChill = useCallback(() => {
    setDrawerValidator();
    navigation.dangerouslyGetParent().pop();
    navigation.navigate(NavigatorName.PolkadotSimpleOperationFlow, {
      screen: ScreenName.PolkadotSimpleOperationStarted,
      params: { mode: "chill", accountId: mainAccount.id },
    });
  }, [navigation, mainAccount]);

  const drawerInfo = useMemo(
    () =>
      drawerValidator
        ? getDrawerInfo({
            t,
            account,
            onOpenExplorer,
            maxNominatorRewardedPerValidator,
            validator: drawerValidator,
          })
        : [],
    [
      drawerValidator,
      t,
      account,
      maxNominatorRewardedPerValidator,
      onOpenExplorer,
    ],
  );

  const renderItem = useCallback(
    ({ item }) => {
      const selected = validators.indexOf(item.address) > -1;

      const disabled = validators.length >= MAX_NOMINATIONS;

      return (
        <ValidatorItem
          item={item}
          disabled={disabled}
          selected={selected}
          onSelect={onSelect}
          onClick={onOpenDrawer}
        />
      );
    },
    [validators, onSelect, onOpenDrawer],
  );

  const error = getFirstStatusError(status, "errors");
  const warning = getFirstStatusError(status, "warnings");
  const maxSelected = validators.length === MAX_NOMINATIONS;
  const maybeChill = error instanceof PolkadotValidatorsRequired;
  const ignoreError =
    error instanceof PolkadotValidatorsRequired && !nominations.length; // Do not show error on first nominate

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <NominationDrawer
        isOpen={drawerInfo && drawerInfo.length > 0}
        onClose={onCloseDrawer}
        account={account}
        ValidatorImage={({ size }) =>
          drawerValidator ? (
            <PolkadotIdenticon address={drawerValidator.address} size={size} />
          ) : null
        }
        data={drawerInfo}
      />
      {nonValidators.length ? (
        <WarningBox>
          <Trans
            i18nKey="polkadot.nominate.steps.validators.notValidatorsRemoved"
            values={{ count: nonValidators.length }}
          />
        </WarningBox>
      ) : null}
      <SelectValidatorSearchBox
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      {sections.length <= 0 && (
        <View style={styles.noResult}>
          <LText style={styles.textCenter}>
            <Trans
              i18nKey="polkadot.nominate.steps.validators.noResultsFound"
              values={{ search: searchQuery }}
            >
              <LText bold>{""}</LText>
            </Trans>
          </LText>
        </View>
      )}
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => item.address + index}
        renderItem={renderItem}
        stickySectionHeadersEnabled
        renderSectionHeader={({ section: { title } }) => (
          <LText
            style={[styles.header, { backgroundColor: colors.lightFog }]}
            color="grey"
          >
            {title}
          </LText>
        )}
      />

      <View
        style={[
          styles.footer,
          { borderTopColor: colors.lightFog, backgroundColor: colors.card },
        ]}
      >
        <View style={styles.paddingBottom}>
          <View style={styles.labelContainer}>
            {!ignoreError && maybeChill ? (
              <TouchableOpacity onPress={onGoToChill}>
                <LText semiBold style={[styles.footerMessage]} color="live">
                  <Trans i18nKey="polkadot.nominate.steps.validators.maybeChill" />
                </LText>
              </TouchableOpacity>
            ) : (
              <>
                {maxSelected && <Check size={12} color={colors.success} />}
                <LText
                  style={[
                    styles.footerMessage,
                    maxSelected && { color: colors.success },
                    !ignoreError && warning && { color: colors.orange },
                    !ignoreError && error && { color: colors.alert },
                  ]}
                >
                  {!ignoreError && (error || warning) ? (
                    <TranslatedError error={error || warning} />
                  ) : (
                    <Trans
                      i18nKey="polkadot.nominate.steps.validators.selected"
                      values={{
                        selected: validators.length,
                        total: MAX_NOMINATIONS,
                      }}
                    />
                  )}
                </LText>
              </>
            )}
          </View>
        </View>
        <SendRowsFee
          account={account}
          parentAccount={parentAccount}
          transaction={transaction}
        />
        <Button
          disabled={!!error || bridgePending}
          event="PolkadotNominateSelectValidatorsContinue"
          onPress={onNext}
          title={
            <Trans
              i18nKey={
                !bridgePending
                  ? "common.continue"
                  : "send.amount.loadingNetwork"
              }
            />
          }
          type="primary"
        />
      </View>

      <FlowErrorBottomModal
        navigation={navigation}
        transaction={transaction}
        account={account}
        parentAccount={parentAccount}
        setTransaction={setTransaction}
        bridgeError={bridgeError}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  noResult: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    height: 32,
    paddingHorizontal: 16,
    lineHeight: 32,
    fontSize: 14,
  },
  footer: {
    borderTopWidth: 1,
    padding: 16,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  footerMessage: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 12,
    paddingHorizontal: 6,
  },
  textCenter: { textAlign: "center" },
  paddingBottom: {
    paddingBottom: 8,
  },
});

export default NominateSelectValidator;
