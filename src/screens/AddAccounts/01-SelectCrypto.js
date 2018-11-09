// @flow

import React, { Component } from "react";
import { translate, Trans } from "react-i18next";
import { SafeAreaView, StyleSheet, View, FlatList } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import type { Currency } from "@ledgerhq/live-common/lib/types";

import { listCryptoCurrencies } from "../../cryptocurrencies";

import FilteredSearchBar from "../../components/FilteredSearchBar";
import Stepper from "../../components/Stepper";
import StepHeader from "../../components/StepHeader";
import KeyboardView from "../../components/KeyboardView";
import CurrencyRow from "../../components/CurrencyRow";
import LText from "../../components/LText";

import colors from "../../colors";

// TODO: handle dev crypto currencies (connect to settings...)
const cryptocurrencies = listCryptoCurrencies();

const SEARCH_KEYS = ["name", "ticker"];

type Props = {
  navigation: NavigationScreenProp<{
    params: {},
  }>,
};

type State = {};

class AddAccountsSelectCrypto extends Component<Props, State> {
  static navigationOptions = {
    headerTitle: <StepHeader title="Crypto asset" subtitle="step 1 of 3" />,
  };

  keyExtractor = currency => currency.id;

  onPressCurrency = (currency: Currency) => {
    this.props.navigation.navigate("AddAccountsSelectDevice", { currency });
  };

  renderItem = ({ item, index }: { item: Currency, index: number }) => (
    <CurrencyRow
      style={
        index === cryptocurrencies.length - 1 ? styles.lastItem : undefined
      }
      currency={item}
      onPress={this.onPressCurrency}
    />
  );

  renderList = (items = cryptocurrencies) => (
    <FlatList
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
        <Stepper nbSteps={4} currentStep={1} />
        <KeyboardView style={{ flex: 1 }}>
          <View style={styles.searchContainer}>
            <FilteredSearchBar
              keys={SEARCH_KEYS}
              inputWrapperStyle={styles.filteredSearchInputWrapperStyle}
              list={cryptocurrencies}
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
    flex: 1,
  },
  lastItem: {
    marginBottom: 32,
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

export default translate()(AddAccountsSelectCrypto);
