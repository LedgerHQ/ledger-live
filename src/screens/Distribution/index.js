/* @flow */
import React, { PureComponent } from "react";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import {
  TouchableOpacity,
  View,
  StyleSheet,
  Platform,
  Dimensions,
  FlatList,
} from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { getAssetsDistribution } from "@ledgerhq/live-common/lib/portfolio";
import { createSelector } from "reselect";
import type { AssetsDistribution } from "@ledgerhq/live-common/lib/types/portfolio";
import type { Currency } from "@ledgerhq/live-common/lib/types/currencies";
import { ScreenName } from "../../const";
import TrackScreen from "../../analytics/TrackScreen";
import { accountsSelector } from "../../reducers/accounts";
import DistributionCard from "./DistributionCard";
import LText from "../../components/LText";
import type { DistributionItem } from "./DistributionCard";
import { counterValueCurrencySelector } from "../../reducers/settings";
import colors from "../../colors";
import RingChart from "./RingChart";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import { calculateCountervalueSelector } from "../../actions/general";

const forceInset = { bottom: "always" };

type Props = {
  navigation: any,
};

type DistributionProps = Props & {
  distribution: AssetsDistribution,
  counterValueCurrency: Currency,
};

const distributionSelector = createSelector(
  accountsSelector,
  calculateCountervalueSelector,
  getAssetsDistribution,
);

class Distribution extends PureComponent<DistributionProps, *> {
  state = {
    highlight: -1,
  };
  flatListRef = React.createRef();

  renderItem = ({ item, index }: { item: DistributionItem, index: number }) => (
    <TouchableOpacity
      onPress={() => this.onHighlightChange(index)}
      onLongPress={() =>
        this.props.navigation.navigate(ScreenName.Asset, {
          currency: item.currency,
        })
      }
    >
      <DistributionCard
        item={item}
        highlighting={index === this.state.highlight}
      />
    </TouchableOpacity>
  );

  onHighlightChange = index => {
    this.setState({ highlight: index });
    if (this.flatListRef.current) {
      this.flatListRef.current.scrollToIndex({ index }, true);
    }
  };

  keyExtractor = item => item.currency.id;

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
      <SafeAreaView style={styles.wrapper} forceInset={forceInset}>
        <TrackScreen category="Distribution" />
        <Header />
        <FlatList
          // $FlowFixMe
          ref={this.flatListRef}
          data={distribution.list}
          renderItem={this.renderItem}
          keyExtractor={this.keyExtractor}
          contentContainerStyle={styles.root}
        />
      </SafeAreaView>
    );
  }
}

export default function Screen({ navigation }: Props) {
  const distribution = useSelector(distributionSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);

  return (
    <Distribution
      navigation={navigation}
      distribution={distribution}
      counterValueCurrency={counterValueCurrency}
    />
  );
}

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
