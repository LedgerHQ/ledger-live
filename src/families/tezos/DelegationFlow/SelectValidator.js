/* @flow */

import invariant from "invariant";
import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Keyboard,
  Platform,
  Linking,
} from "react-native";
import { useSelector } from "react-redux";
import SafeAreaView from "react-native-safe-area-view";
import { useTranslation, Trans } from "react-i18next";
import Icon from "react-native-vector-icons/dist/Feather";
import type {
  AccountLike,
  Account,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/lib/types";
import { RecipientRequired } from "@ledgerhq/errors";
import useBridgeTransaction from "@ledgerhq/live-common/lib/bridge/useBridgeTransaction";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import type { Baker } from "@ledgerhq/live-common/lib/families/tezos/bakers";
import { useBakers } from "@ledgerhq/live-common/lib/families/tezos/bakers";
import whitelist from "@ledgerhq/live-common/lib/families/tezos/bakers.whitelist-default";
import { accountScreenSelector } from "../../../reducers/accounts";
import { TrackScreen } from "../../../analytics";
import colors from "../../../colors";
import { ScreenName } from "../../../const";
import InfoModal from "../../../components/InfoModal";
import LText, { getFontStyle } from "../../../components/LText";
import Touchable from "../../../components/Touchable";
import Button from "../../../components/Button";
import TextInput from "../../../components/TextInput";
import TranslatedError from "../../../components/TranslatedError";
import ExternalLink from "../../../components/ExternalLink";
import Info from "../../../icons/Info";
import BakerImage from "../BakerImage";

const forceInset = { bottom: "always" };

const keyExtractor = baker => baker.address;

const BakerHead = ({ onPressHelp }: { onPressHelp: () => void }) => (
  <View style={styles.bakerHead}>
    <LText style={styles.bakerHeadText} numberOfLines={1} semiBold>
      Validator
    </LText>
    <View style={styles.bakerHeadContainer}>
      <LText style={styles.bakerHeadText} numberOfLines={1} semiBold>
        Est. Yield
      </LText>
      <Touchable
        style={styles.bakerHeadInfo}
        event="StepValidatorShowProvidedBy"
        onPress={onPressHelp}
      >
        <Info color={colors.smoke} size={14} />
      </Touchable>
    </View>
  </View>
);

const BakerRow = ({
  onPress,
  baker,
}: {
  onPress: Baker => void,
  baker: Baker,
}) => {
  const onPressT = useCallback(() => {
    onPress(baker);
  }, [baker, onPress]);

  return (
    <Touchable
      event="DelegationFlowChoseBaker"
      eventProperties={{
        bakerName: baker.name,
      }}
      onPress={onPressT}
    >
      <View style={styles.baker}>
        <BakerImage size={32} baker={baker} />
        {baker.capacityStatus === "full" ? (
          <View style={styles.overdelegatedIndicator} />
        ) : null}
        <View style={styles.bakerBody}>
          <LText numberOfLines={1} semiBold style={styles.bakerName}>
            {baker.name}
          </LText>
          {baker.capacityStatus === "full" ? (
            <LText semiBold numberOfLines={1} style={styles.overdelegated}>
              <Trans i18nKey="delegation.overdelegated" />
            </LText>
          ) : null}
        </View>
        <LText
          tertiary
          numberOfLines={1}
          style={[
            styles.bakerYield,
            baker.capacityStatus === "full" ? styles.bakerYieldFull : null,
          ]}
        >
          {baker.nominalYield}
        </LText>
      </View>
    </Touchable>
  );
};

const ModalIcon = () => <Icon name="user-plus" size={24} color={colors.live} />;

type Props = {
  account: AccountLike,
  parentAccount: ?Account,
  navigation: any,
  route: { params: RouteParams },
};

type RouteParams = {
  accountId: string,
  transaction: Transaction,
  status: TransactionStatus,
};

export default function SelectValidator({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  const bakers = useBakers(whitelist);
  const [editingCustom, setEditingCustom] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showInfos, setShowInfos] = useState(false);

  if (Platform.OS === "ios") {
    const keyboardDidShow = event => {
      const { height } = event.endCoordinates;

      setKeyboardHeight(height);
    };

    const keyboardDidHide = () => {
      setKeyboardHeight(0);
    };

    // The platform changing during runtime seems... unlikely
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      const keyboardDidShowListener = Keyboard.addListener(
        "keyboardDidShow",
        keyboardDidShow,
      );
      const keyboardDidHideListener = Keyboard.addListener(
        "keyboardDidHide",
        keyboardDidHide,
      );

      return () => {
        keyboardDidShowListener.remove();
        keyboardDidHideListener.remove();
      };
    });
  }

  const {
    transaction,
    setTransaction,
    status,
    bridgePending,
    bridgeError,
  } = useBridgeTransaction(() => {
    const bridge = getAccountBridge(account, parentAccount);
    return {
      account,
      parentAccount,
      transaction: bridge.updateTransaction(route.params?.transaction, {
        recipient: "",
      }),
    };
  });

  invariant(transaction, "transaction is defined");

  let error = bridgeError || status.errors.recipient;

  if (error instanceof RecipientRequired) {
    error = null;
  }

  const onChangeText = useCallback(
    recipient => {
      const bridge = getAccountBridge(account, parentAccount);
      setTransaction(bridge.updateTransaction(transaction, { recipient }));
    },
    [account, parentAccount, setTransaction, transaction],
  );

  const clear = useCallback(() => onChangeText(""), [onChangeText]);

  const continueCustom = useCallback(() => {
    setEditingCustom(false);
    navigation.navigate(ScreenName.DelegationSummary, {
      ...route.params,
      transaction,
    });
  }, [navigation, transaction, route.params]);

  const enableCustomValidator = useCallback(() => {
    setEditingCustom(true);
  }, []);

  const disableCustomValidator = useCallback(() => {
    setEditingCustom(false);
  }, []);

  const displayInfos = useCallback(() => {
    setShowInfos(true);
  }, []);

  const hideInfos = useCallback(() => {
    setShowInfos(false);
  }, []);

  const onItemPress = useCallback(
    (baker: Baker) => {
      const bridge = getAccountBridge(account, parentAccount);
      const transaction = bridge.updateTransaction(route.params?.transaction, {
        recipient: baker.address,
      });
      navigation.navigate(ScreenName.DelegationSummary, {
        ...route.params,
        transaction,
      });
    },
    [navigation, account, parentAccount, route.params],
  );

  const renderItem = useCallback(
    ({ item }) => <BakerRow baker={item} onPress={onItemPress} />,
    [onItemPress],
  );

  return (
    <SafeAreaView style={styles.root} forceInset={forceInset}>
      <TrackScreen category="DelegationFlow" name="SelectValidator" />
      <View style={styles.header}>
        {/* TODO SEARCH */}
        <BakerHead onPressHelp={displayInfos} />
      </View>
      <FlatList
        contentContainerStyle={styles.list}
        data={bakers}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
      />

      <InfoModal
        withCancel
        Icon={ModalIcon}
        onContinue={continueCustom}
        onClose={disableCustomValidator}
        isOpened={editingCustom}
        id="SelectValidatorCustom"
        title="Custom validator"
        desc="Please enter the address of the custom validator to delegate your account to."
        confirmLabel="Confirm validator"
        confirmProps={{
          disabled: bridgePending || !!status.errors.recipient,
          pending: bridgePending,
        }}
        style={keyboardHeight ? { marginBottom: keyboardHeight } : undefined}
        containerStyle={styles.infoModalContainerStyle}
      >
        <TextInput
          placeholder="Enter validator address"
          placeholderTextColor={colors.fog}
          style={[styles.addressInput, error && styles.invalidAddressInput]}
          onChangeText={onChangeText}
          onInputCleared={clear}
          value={transaction.recipient}
          blurOnSubmit
          autoCapitalize="none"
          clearButtonMode="always"
        />

        {error && (
          <LText style={[styles.warningBox, styles.error]}>
            <TranslatedError error={error} />
          </LText>
        )}
      </InfoModal>

      <InfoModal
        id="SelectValidatorInfos"
        isOpened={showInfos}
        onClose={hideInfos}
        confirmLabel={t("common.close")}
      >
        <View style={styles.providedByContainer}>
          <LText semiBold style={styles.providedByText}>
            <Trans i18nKey="delegation.yieldInfos" />
          </LText>
          <ExternalLink
            text={<LText bold>MyTezosBaker</LText>}
            event="SelectValidatorOpen"
            onPress={() => Linking.openURL("https://mytezosbaker.com/")}
          />
        </View>
      </InfoModal>

      <View style={styles.footer}>
        <Button
          type="secondary"
          title="+ Add custom validator"
          event="DelegationFlowAddCustom"
          onPress={enableCustomValidator}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    padding: 16,
  },
  list: {
    paddingHorizontal: 16,
  },
  footer: {
    padding: 16,
  },
  center: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  bakerHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bakerHeadText: {
    color: colors.smoke,
    fontSize: 14,
  },
  bakerHeadContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  bakerHeadInfo: {
    marginLeft: 5,
  },
  baker: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
  },
  bakerBody: {
    flex: 1,
    flexDirection: "column",
    marginLeft: 12,
  },
  bakerName: {
    fontSize: 14,
    color: colors.darkBlue,
  },
  overdelegatedIndicator: {
    position: "absolute",
    backgroundColor: colors.orange,
    width: 10,
    height: 10,
    borderRadius: 10,
    top: 34,
    left: 24,
    borderColor: colors.white,
    borderWidth: 1,
  },
  overdelegated: {
    fontSize: 12,
    color: colors.orange,
  },
  bakerYield: {
    fontSize: 14,
    color: colors.smoke,
  },
  bakerYieldFull: {
    opacity: 0.5,
  },
  addressInput: {
    color: colors.darkBlue,
    ...getFontStyle({ semiBold: true }),
    fontSize: 20,
    paddingVertical: 16,
  },
  invalidAddressInput: {
    color: colors.alert,
  },
  warningBox: {
    alignSelf: "stretch",
    marginTop: 8,
  },
  error: {
    color: colors.alert,
  },
  providedByContainer: {
    display: "flex",
    flexDirection: "row",
  },
  providedByText: {
    fontSize: 14,
    marginRight: 5,
    color: colors.grey,
  },
  infoModalContainerStyle: {
    alignSelf: "stretch",
  },
});
