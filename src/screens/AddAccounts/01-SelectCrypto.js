// @flow

import React, { Component } from "react";
import { translate } from "react-i18next";
import { SafeAreaView, StyleSheet, View, FlatList } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import type { Currency } from "@ledgerhq/live-common/lib/types";

import { listCryptoCurrencies } from "../../cryptocurrencies";

import FilteredSearchBar from "../../components/FilteredSearchBar";
import Stepper from "../../components/Stepper";
import StepHeader from "../../components/StepHeader";
import KeyboardView from "../../components/KeyboardView";
import CurrencyRow from "../../components/CurrencyRow";

import colors from "../../colors";

// TODO: handle dev crypto currencies (connect to settings...)
const cryptocurrencies = listCryptoCurrencies();

type Props = {
  t: *,
  navigation: NavigationScreenProp<{
    params: {},
  }>,
};

type State = {};

class AddAccountsSelectCrypto extends Component<Props, State> {
  static navigationOptions = {
    headerTitle: <StepHeader title="Crypto asset" subtitle="step 1 of 4" />,
  };

  keyExtractor = currency => currency.id;

  onPressCurrency = (currency: Currency) => {
    this.props.navigation.navigate("AddAccountsSelectDevice", { currency });
  };

  renderItem = ({ item }: { item: Currency }) => (
    <CurrencyRow currency={item} onPress={this.onPressCurrency} />
  );

  renderList = (items = cryptocurrencies) => (
    <FlatList
      data={items}
      renderItem={this.renderItem}
      keyExtractor={this.keyExtractor}
    />
  );

  render() {
    return (
      <SafeAreaView style={styles.root}>
        <Stepper nbSteps={4} currentStep={1} />
        <KeyboardView style={{ flex: 1 }}>
          <View style={styles.searchContainer}>
            <FilteredSearchBar
              inputWrapperStyle={styles.filteredSearchInputWrapperStyle}
              list={cryptocurrencies}
              renderList={this.renderList}
              renderEmptySearch={this.renderList}
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
  filteredSearchInputWrapperStyle: {
    marginHorizontal: 16,
  },
});

export default translate()(AddAccountsSelectCrypto);
