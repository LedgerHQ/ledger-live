/* @flow */

import invariant from "invariant";
import React, { useState, useCallback, useEffect } from "react";
import { View, StyleSheet, FlatList, Keyboard, Platform } from "react-native";
import i18next from "i18next";
import { connect } from "react-redux";
import { SafeAreaView } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import { translate } from "react-i18next";
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
import { accountAndParentScreenSelector } from "../../../reducers/accounts";
import { TrackScreen } from "../../../analytics";
import colors from "../../../colors";
import InfoModal from "../../../components/InfoModal";
import StepHeader from "../../../components/StepHeader";
import LText, { getFontStyle } from "../../../components/LText";
import Touchable from "../../../components/Touchable";
import Button from "../../../components/Button";
import TextInput from "../../../components/TextInput";
import TranslatedError from "../../../components/TranslatedError";
import BakerImage from "../BakerImage";

const forceInset = { bottom: "always" };

type Props = {
  account: AccountLike,
  parentAccount: ?Account,
  navigation: NavigationScreenProp<{
    params: {
      accountId: string,
      transaction: Transaction,
      status: TransactionStatus,
    },
  }>,
};

const keyExtractor = baker => baker.address;

const BakerHead = () => (
  <View style={styles.bakerHead}>
    <LText style={styles.bakerHeadText} numberOfLines={1} semiBold>
      Validators
    </LText>
    <LText style={styles.bakerHeadText} numberOfLines={1} semiBold>
      Yield
    </LText>
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
        <LText numberOfLines={1} semiBold style={styles.bakerName}>
          {baker.name}
        </LText>
        <LText numberOfLines={1} style={styles.bakerYield}>
          {baker.nominalYield}
        </LText>
      </View>
    </Touchable>
  );
};

const ModalIcon = () => <Icon name="user-plus" size={24} color={colors.live} />;

const SelectValidator = ({ account, parentAccount, navigation }: Props) => {
  const bakers = useBakers(whitelist);
  const [editingCustom, setEditingCustom] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

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
      transaction: bridge.updateTransaction(
        navigation.getParam("transaction"),
        { recipient: "" },
      ),
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
    navigation.navigate("DelegationSummary", {
      ...navigation.state.params,
      transaction,
    });
  }, [navigation, transaction]);

  const enableCustomValidator = useCallback(() => {
    setEditingCustom(true);
  }, []);

  const disableCustomValidator = useCallback(() => {
    setEditingCustom(false);
  }, []);

  const onItemPress = useCallback(
    (baker: Baker) => {
      const bridge = getAccountBridge(account, parentAccount);
      const transaction = bridge.updateTransaction(
        navigation.getParam("transaction"),
        { recipient: baker.address },
      );
      navigation.navigate("DelegationSummary", {
        ...navigation.state.params,
        transaction,
      });
    },
    [navigation, account, parentAccount],
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
        <BakerHead />
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
          disabled: bridgePending || !!error,
          pending: bridgePending,
        }}
        style={keyboardHeight ? { marginBottom: keyboardHeight } : undefined}
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
};

SelectValidator.navigationOptions = {
  headerTitle: (
    <StepHeader title={i18next.t("delegation.selectValidatorTitle")} />
  ),
};

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
  baker: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
  },
  bakerName: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: colors.darkBlue,
  },
  bakerYield: {
    fontSize: 14,
    color: colors.smoke,
  },
  addressInput: {
    alignSelf: "stretch",
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
});

const mapStateToProps = accountAndParentScreenSelector;

export default connect(mapStateToProps)(translate()(SelectValidator));
