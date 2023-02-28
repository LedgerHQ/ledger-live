import invariant from "invariant";
import React, { useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { Trans } from "react-i18next";
import { useSelector } from "react-redux";
import { getMainAccount } from "@ledgerhq/live-common/account/helpers";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/impl";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { listTokensForCryptoCurrency } from "@ledgerhq/live-common/currencies/index";
import type { Transaction as StellarTransaction } from "@ledgerhq/live-common/families/stellar/types";
import type { SubAccount } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useTheme } from "@react-navigation/native";
import { ScreenName } from "../../../const";
import LText from "../../../components/LText";
import { accountScreenSelector } from "../../../reducers/accounts";
import { TrackScreen } from "../../../analytics";
import FilteredSearchBar from "../../../components/FilteredSearchBar";
import FirstLetterIcon from "../../../components/FirstLetterIcon";
import KeyboardView from "../../../components/KeyboardView";
import InfoIcon from "../../../components/InfoIcon";
import Info from "../../../icons/Info";
import QueuedDrawer from "../../../components/QueuedDrawer";
import { StackNavigatorProps } from "../../../components/RootNavigator/types/helpers";
import { StellarAddAssetFlowParamList } from "./types";

const Row = ({
  item,
  onPress,
  onDisabledPress,
  disabled,
}: {
  item: TokenCurrency;
  onPress: () => void;
  onDisabledPress: () => void;
  disabled: boolean;
}) => {
  const { colors } = useTheme();
  const tokenId = item.id.split("/")[2];
  const assetIssuer = tokenId.split(":")[1];
  return (
    <TouchableOpacity
      style={[styles.row]}
      onPress={disabled ? onDisabledPress : onPress}
    >
      <FirstLetterIcon
        label={item.name}
        labelStyle={
          disabled
            ? {
                color: colors.grey,
              }
            : {}
        }
      />
      <LText
        semiBold
        style={[
          styles.name,
          disabled
            ? {
                color: colors.grey,
              }
            : {},
        ]}
      >
        {item.name}
      </LText>
      <LText style={styles.ticker} color="grey">
        -
      </LText>
      <LText
        style={styles.assetId}
        color="grey"
        numberOfLines={1}
        ellipsizeMode="middle"
      >
        {assetIssuer}
      </LText>
    </TouchableOpacity>
  );
};

const keyExtractor = (token: TokenCurrency) => token.id;

const renderEmptyList = () => (
  <View style={styles.emptySearch}>
    <LText style={styles.emptySearchText}>
      <Trans i18nKey="common.noCryptoFound" />
    </LText>
  </View>
);

type Props = StackNavigatorProps<
  StellarAddAssetFlowParamList,
  ScreenName.StellarAddAssetSelectAsset
>;

export default function DelegationStarted({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));
  invariant(account, "Account required");
  const mainAccount = getMainAccount(account);
  const bridge = getAccountBridge(mainAccount);
  invariant(mainAccount, "stellar Account required");
  const { transaction, status } = useBridgeTransaction(() => {
    const t = bridge.createTransaction(mainAccount);
    return {
      account,
      transaction: bridge.updateTransaction(t, {
        mode: "changeTrust",
      }),
    };
  });
  const onNext = useCallback(
    (assetId: string) => {
      const tokenId = assetId.split("/")[2];
      const [assetCode, assetIssuer] = tokenId.split(":");
      const t = bridge.updateTransaction(transaction, {
        assetCode,
        assetIssuer,
      }) as StellarTransaction;
      navigation.navigate(ScreenName.StellarAddAssetSelectDevice, {
        ...route.params,
        transaction: t,
        status,
      });
    },
    [bridge, transaction, navigation, route.params, status],
  );
  const options = listTokensForCryptoCurrency(mainAccount.currency);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const openModal = useCallback(
    token => setInfoModalOpen(token),
    [setInfoModalOpen],
  );
  const closeModal = useCallback(
    () => setInfoModalOpen(false),
    [setInfoModalOpen],
  );
  const renderList = useCallback(
    list => (
      <FlatList
        data={list}
        renderItem={({ item }: { item: TokenCurrency }) => (
          <Row
            item={item}
            disabled={(mainAccount.subAccounts || []).some(
              (sub: SubAccount) =>
                sub.type === "TokenAccount" &&
                sub.token &&
                sub.token.id === item.id,
            )}
            onPress={() => onNext(item.id)}
            onDisabledPress={() => openModal(item.name)}
          />
        )}
        keyExtractor={keyExtractor}
      />
    ),
    [mainAccount.subAccounts, onNext, openModal],
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
      <TrackScreen category="DelegationFlow" name="Started" />
      <KeyboardView style={styles.keyboardView}>
        <View style={styles.searchContainer}>
          <FilteredSearchBar
            renderList={renderList}
            inputWrapperStyle={styles.filteredSearchInputWrapperStyle}
            renderEmptySearch={renderEmptyList}
            keys={["name", "ticker"]}
            list={options}
          />
        </View>
      </KeyboardView>
      <QueuedDrawer
        isRequestingToBeOpened={!!infoModalOpen}
        onClose={closeModal}
      >
        <View style={styles.modal}>
          <View style={styles.infoIcon}>
            <InfoIcon bg={colors.lightLive}>
              <Info size={30} color={colors.live} />
            </InfoIcon>
          </View>
          <View style={styles.infoRow}>
            <LText style={[styles.warnText, styles.title]} semiBold>
              <Trans
                i18nKey={`stellar.addAsset.flow.steps.selectToken.warning.title`}
              />
            </LText>
            <LText style={styles.warnText} color="grey">
              <Trans
                i18nKey={`stellar.addAsset.flow.steps.selectToken.warning.description`}
                values={{
                  token: infoModalOpen,
                }}
              />
            </LText>
          </View>
        </View>
      </QueuedDrawer>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  searchContainer: {
    paddingTop: 16,
    flex: 1,
  },
  filteredSearchInputWrapperStyle: {
    marginHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  name: {
    marginLeft: 10,
    fontSize: 14,
  },
  ticker: {
    marginHorizontal: 5,
    fontSize: 12,
  },
  assetId: {
    fontSize: 12,
    flex: 1,
  },
  emptySearch: {
    paddingHorizontal: 16,
  },
  emptySearchText: {
    textAlign: "center",
  },
  infoIcon: {
    width: 80,
    marginVertical: 16,
  },
  title: {
    lineHeight: 24,
    fontSize: 16,
  },
  warnText: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 16,
    marginVertical: 8,
  },
  infoRow: {
    paddingHorizontal: 16,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  modal: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
});
