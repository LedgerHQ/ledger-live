import invariant from "invariant";
import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Keyboard,
  Platform,
  Linking,
  KeyboardEventListener,
} from "react-native";
import { useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation, Trans } from "react-i18next";
import Icon from "react-native-vector-icons/Feather";
import { RecipientRequired } from "@ledgerhq/errors";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import type { Transaction as TezosTransaction } from "@ledgerhq/live-common/families/tezos/types";
import type { Baker } from "@ledgerhq/live-common/families/tezos/bakers";
import { useBakers } from "@ledgerhq/live-common/families/tezos/bakers";
import whitelist from "@ledgerhq/live-common/families/tezos/bakers.whitelist-default";
import { useTheme } from "@react-navigation/native";
import { accountScreenSelector } from "../../../reducers/accounts";
import { TrackScreen } from "../../../analytics";
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
import { StackNavigatorProps } from "../../../components/RootNavigator/types/helpers";
import { TezosDelegationFlowParamList } from "./types";

const keyExtractor = (baker: Baker) => baker.address;

const BakerHead = ({ onPressHelp }: { onPressHelp: () => void }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={styles.bakerHead}>
      <LText
        style={styles.bakerHeadText}
        color="smoke"
        numberOfLines={1}
        semiBold
      >
        {t("delegation.validator")}
      </LText>
      <View style={styles.bakerHeadContainer}>
        <LText
          style={styles.bakerHeadText}
          color="smoke"
          numberOfLines={1}
          semiBold
        >
          {t("delegation.yield")}
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
};

const BakerRow = ({
  onPress,
  baker,
}: {
  onPress: (arg0: Baker) => void;
  baker: Baker;
}) => {
  const { colors } = useTheme();
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
          <View
            style={[
              styles.overdelegatedIndicator,
              {
                backgroundColor: colors.orange,
                borderColor: colors.white,
              },
            ]}
          />
        ) : null}
        <View style={styles.bakerBody}>
          <LText numberOfLines={1} semiBold style={styles.bakerName}>
            {baker.name}
          </LText>
          {baker.capacityStatus === "full" ? (
            <LText
              semiBold
              numberOfLines={1}
              style={styles.overdelegated}
              color="orange"
            >
              <Trans i18nKey="delegation.overdelegated" />
            </LText>
          ) : null}
        </View>
        <LText
          semiBold
          numberOfLines={1}
          style={[
            styles.bakerYield,
            baker.capacityStatus === "full" ? styles.bakerYieldFull : null,
          ]}
          color="smoke"
        >
          {baker.nominalYield}
        </LText>
      </View>
    </Touchable>
  );
};

const ModalIcon = () => {
  const { colors } = useTheme();
  return <Icon name="user-plus" size={24} color={colors.live} />;
};

type Props = StackNavigatorProps<
  TezosDelegationFlowParamList,
  ScreenName.DelegationSelectValidator
>;

export default function SelectValidator({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  const bakers = useBakers(whitelist);
  const [editingCustom, setEditingCustom] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showInfos, setShowInfos] = useState(false);

  if (Platform.OS === "ios") {
    const keyboardDidShow: KeyboardEventListener = event => {
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

  invariant(account, "account is undefined");
  const { transaction, setTransaction, status, bridgePending, bridgeError } =
    useBridgeTransaction(() => {
      const bridge = getAccountBridge(account, parentAccount);
      return {
        account,
        parentAccount,
        transaction: bridge.updateTransaction(route.params?.transaction, {
          recipient: "",
        }),
      };
    });
  invariant(transaction, "transaction is undefined");
  let error: Error | null = bridgeError || status.errors.recipient;

  if (error instanceof RecipientRequired) {
    error = null;
  }

  const onChangeText = useCallback(
    recipient => {
      const bridge = getAccountBridge(account, parentAccount);
      setTransaction(
        bridge.updateTransaction(transaction, {
          recipient,
        }),
      );
    },
    [account, parentAccount, setTransaction, transaction],
  );
  const continueCustom = useCallback(() => {
    setEditingCustom(false);
    navigation.navigate(ScreenName.DelegationSummary, {
      ...route.params,
      transaction: transaction as TezosTransaction,
      status,
    });
  }, [navigation, route.params, transaction, status]);
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
        transaction: transaction as TezosTransaction,
        status,
      });
    },
    [account, parentAccount, route.params, navigation, status],
  );
  const renderItem = useCallback(
    ({ item }) => <BakerRow baker={item} onPress={onItemPress} />,
    [onItemPress],
  );
  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
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
        style={
          keyboardHeight
            ? {
                marginBottom: keyboardHeight,
              }
            : undefined
        }
        containerStyle={styles.infoModalContainerStyle}
      >
        <TextInput
          placeholder="Enter validator address"
          placeholderTextColor={colors.fog}
          style={[
            styles.addressInput,
            error
              ? {
                  color: colors.alert,
                }
              : {
                  color: colors.darkBlue,
                },
          ]}
          onChangeText={onChangeText}
          value={transaction.recipient}
          blurOnSubmit
          autoCapitalize="none"
          clearButtonMode="always"
        />

        {error && (
          <LText style={[styles.warningBox]} color="alert">
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
          <LText semiBold style={styles.providedByText} color="grey">
            <Trans i18nKey="delegation.yieldInfos" />
          </LText>
          <ExternalLink
            text={<LText bold>Baking Bad</LText>}
            event="SelectValidatorOpen"
            onPress={() => Linking.openURL("https://baking-bad.org/")}
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
  },
  overdelegatedIndicator: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 10,
    top: 34,
    left: 24,
    borderWidth: 1,
  },
  overdelegated: {
    fontSize: 12,
  },
  bakerYield: {
    fontSize: 14,
  },
  bakerYieldFull: {
    opacity: 0.5,
  },
  addressInput: {
    ...getFontStyle({
      semiBold: true,
    }),
    fontSize: 20,
    paddingVertical: 16,
  },
  warningBox: {
    alignSelf: "stretch",
    marginTop: 8,
  },
  providedByContainer: {
    display: "flex",
    flexDirection: "row",
  },
  providedByText: {
    fontSize: 14,
    marginRight: 5,
  },
  infoModalContainerStyle: {
    alignSelf: "stretch",
  },
});
