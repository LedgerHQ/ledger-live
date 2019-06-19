/* @flow */
import React, { PureComponent } from "react";
import { compose } from "redux";
import { connect } from "react-redux";

import { Trans, translate } from "react-i18next";
import {
  TouchableOpacity,
  View,
  StyleSheet,
  Platform,
  Dimensions,
} from "react-native";
// $FlowFixMe
import { FlatList, SafeAreaView } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import i18next from "i18next";
import { getAssetsDistribution } from "@ledgerhq/live-common/lib/portfolio";
import { createStructuredSelector, createSelector } from "reselect";
import type { AssetsDistribution } from "@ledgerhq/live-common/lib/types/portfolio";
import type { Currency } from "@ledgerhq/live-common/lib/types/currencies";
import type { T } from "../../types/common";
import TrackScreen from "../../analytics/TrackScreen";
import { accountsSelector } from "../../reducers/accounts";
import DistributionCard from "./DistributionCard";
import LText from "../../components/LText";
import type { DistributionItem } from "./DistributionCard";
import { counterValueCurrencySelector } from "../../reducers/settings";
import colors from "../../colors";
import RingChart from "./RingChart";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import globalSyncRefreshControl from "../../components/globalSyncRefreshControl";
import { calculateCountervalueSelector } from "../../actions/general";

type Props = {
  navigation: NavigationScreenProp<*>,
  distribution: AssetsDistribution,
  counterValueCurrency: Currency,
  t: T,
};
const List = globalSyncRefreshControl(FlatList);

const distributionSelector = createSelector(
  accountsSelector,
  calculateCountervalueSelector,
  getAssetsDistribution,
);

const mapStateToProps = createStructuredSelector({
  distribution: distributionSelector,
  counterValueCurrency: counterValueCurrencySelector,
});

class Distribution extends PureComponent<Props, *> {
  state = {
    highlight: -1,
  };
  flatListRef: *;

  static navigationOptions = {
    title: i18next.t("distribution.header"),
    headerLeft: null,
  };

  renderItem = ({ item, index }: { item: DistributionItem, index: number }) => (
    <TouchableOpacity onPress={() => this.onHighlightChange(index)}>
      <DistributionCard
        item={item}
        highlighting={index === this.state.highlight}
      />
    </TouchableOpacity>
  );

  onHighlightChange = index => {
    this.setState({ highlight: index });
    this.flatListRef.scrollToIndex({ index }, true);
  };

  keyExtractor = item => item.id;

  ListHeaderComponent = () => {
    const { counterValueCurrency, distribution } = this.props;
    const { highlight } = this.state;
    const size = Dimensions.get("window").width / 3;
    return (
      <View>
        <View style={styles.header}>
          <View style={[styles.chartWrapper, { height: size }]}>
            <RingChart
              size={size}
              onHighlightChange={this.onHighlightChange}
              highlight={highlight}
              data={distribution.list}
            />
            <View style={styles.assetWrapper} pointerEvents="none">
              <LText tertiary style={styles.assetCount}>
                {distribution.list.length}
              </LText>
              <LText tertiary style={styles.assets}>
                <Trans i18nKey="distribution.assets" />
              </LText>
            </View>
          </View>
          <View style={styles.total}>
            <LText tertiary style={styles.label}>
              <Trans i18nKey="distribution.total" />
            </LText>
            <LText tertiary style={styles.amount}>
              <CurrencyUnitValue
                unit={counterValueCurrency.units[0]}
                value={distribution.sum}
              />
            </LText>
          </View>
        </View>
        <LText bold secondary style={styles.distributionTitle}>
          <Trans
            i18nKey="distribution.list"
            count={distribution.list.length}
            values={{ count: distribution.list.length }}
          />
        </LText>
      </View>
    );
  };

  render() {
    const { distribution } = this.props;

    const Header = this.ListHeaderComponent;
    return (
      <SafeAreaView style={styles.wrapper}>
        <TrackScreen category="Distribution" />
        <Header />
        <List
          forwardedRef={ref => {
            this.flatListRef = ref;
          }}
          data={distribution.list}
          renderItem={this.renderItem}
          keyExtractor={this.keyExtractor}
          contentContainerStyle={styles.root}
        />
      </SafeAreaView>
    );
  }
}

export default compose(
  translate(),
  connect(mapStateToProps),
)(Distribution);

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  root: {
    padding: 16,
    paddingTop: 0,
    backgroundColor: colors.lightGrey,
    paddingBottom: 16,
  },
  distributionTitle: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.darkBlue,
    marginLeft: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  header: {
    backgroundColor: colors.white,
    borderRadius: 4,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    margin: 16,
    ...Platform.select({
      android: {
        elevation: 1,
      },
      ios: {
        shadowOpacity: 0.03,
        shadowRadius: 8,
        shadowOffset: {
          height: 4,
        },
      },
    }),
  },
  chartWrapper: {
    marginRight: 4,
    justifyContent: "flex-end",
  },

  assetWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  assetCount: {
    fontSize: 27,
    color: colors.darkBlue,
  },

  assets: {
    color: colors.darkBlue,
  },

  label: {
    fontSize: 14,
    color: colors.smoke,
  },

  amount: {
    fontSize: 22,
    color: colors.darkBlue,
  },

  total: {
    alignItems: "flex-start",
    marginLeft: 4,
  },
});
