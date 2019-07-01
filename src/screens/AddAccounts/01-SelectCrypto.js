// @flow

import React, { Component } from "react";
import { translate, Trans } from "react-i18next";
import { StyleSheet, View } from "react-native";
// $FlowFixMe
import { SafeAreaView, FlatList } from "react-navigation";
import i18next from "i18next";
import { compose } from "redux";
import type { NavigationScreenProp } from "react-navigation";
import type { CryptoCurrency } from "@ledgerhq/live-common/lib/types";

import { listCryptoCurrencies } from "../../cryptocurrencies";
import { TrackScreen } from "../../analytics";
import FilteredSearchBar from "../../components/FilteredSearchBar";
import StepHeader from "../../components/StepHeader";
import KeyboardView from "../../components/KeyboardView";
import CurrencyRow from "../../components/CurrencyRow";
import LText from "../../components/LText";

import colors from "../../colors";
import withEnv from "../../logic/withEnv";

const SEARCH_KEYS = ["name", "ticker"];

type Props = {
  devMode: boolean,
  navigation: NavigationScreenProp<{
    params: {},
  }>,
};

type State = {};

class AddAccountsSelectCrypto extends Component<Props, State> {
  static navigationOptions = {
    headerTitle: (
      <StepHeader
        title={i18next.t("common.cryptoAsset")}
        subtitle={i18next.t("send.stepperHeader.stepRange", {
          currentStep: "1",
          totalSteps: "3",
        })}
      />
    ),
  };

  cryptocurrencies = listCryptoCurrencies(this.props.devMode);

  keyExtractor = currency => currency.id;

  onPressCurrency = (currency: CryptoCurrency) => {
    this.props.navigation.navigate("AddAccountsSelectDevice", { currency });
  };

  renderItem = ({ item }: { item: CryptoCurrency }) => (
    <CurrencyRow currency={item} onPress={this.onPressCurrency} />
  );

  renderList = items => (
    <FlatList
      contentContainerStyle={styles.list}
      data={items}
      renderItem={this.renderItem}
      keyExtractor={this.keyExtractor}
      showsVerticalScrollIndicator={false}
      keyboardDismissMode="on-drag"
    />
  );

  renderEmptyList = () => (
    <View style={styles.emptySearch}>
      <LText style={styles.emptySearchText}>
        <Trans i18nKey="common.noCryptoFound" />
      </LText>
    </View>
  );

  render() {
    return (
      <SafeAreaView style={styles.root}>
        <TrackScreen category="AddAccounts" name="SelectCrypto" />
        <KeyboardView style={{ flex: 1 }}>
          <View style={styles.searchContainer}>
            <FilteredSearchBar
              keys={SEARCH_KEYS}
              inputWrapperStyle={styles.filteredSearchInputWrapperStyle}
              list={this.cryptocurrencies}
              renderList={this.renderList}
              renderEmptySearch={this.renderEmptyList}
            />
          </View>
        </KeyboardView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  searchContainer: {
    paddingTop: 16,
    flex: 1,
  },
  list: {
    paddingBottom: 32,
  },
  filteredSearchInputWrapperStyle: {
    marginHorizontal: 16,
  },
  emptySearch: {
    paddingHorizontal: 16,
  },
  emptySearchText: {
    textAlign: "center",
  },
});

const enhancer = compose(
  translate(),
  withEnv("MANAGER_DEV_MODE", "devMode"),
);

export default enhancer(AddAccountsSelectCrypto);
