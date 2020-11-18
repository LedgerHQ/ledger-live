// @flow
import React, { useState, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  TouchableOpacity,
  View,
  StyleSheet,
  Platform,
  Dimensions,
  FlatList,
} from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import type { AssetsDistribution } from "@ledgerhq/live-common/lib/types";
import { ScreenName } from "../../const";
import TrackScreen from "../../analytics/TrackScreen";
import DistributionCard from "./DistributionCard";
import LText from "../../components/LText";
import type { DistributionItem } from "./DistributionCard";
import { counterValueCurrencySelector } from "../../reducers/settings";
import colors from "../../colors";
import RingChart from "./RingChart";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import { useDistribution } from "../../actions/general";

const forceInset = { bottom: "always" };

type Props = {
  navigation: any,
};

export default function Distribution({ navigation }: Props) {
  const distribution = useDistribution();

  const [highlight, setHighlight] = useState(-1);
  const flatListRef = useRef();

  const onHighlightChange = useCallback(index => {
    setHighlight(index);
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({ index }, true);
    }
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: DistributionItem, index: number }) => (
      <TouchableOpacity
        onPress={() => onHighlightChange(index)}
        onLongPress={() =>
          navigation.navigate(ScreenName.Asset, {
            currency: item.currency,
          })
        }
      >
        <DistributionCard item={item} highlighting={index === highlight} />
      </TouchableOpacity>
    ),
    [onHighlightChange, navigation, highlight],
  );

  return (
    <SafeAreaView style={styles.wrapper} forceInset={forceInset}>
      <TrackScreen category="Distribution" />
      <Header
        distribution={distribution}
        highlight={highlight}
        onHighlightChange={onHighlightChange}
      />
      <FlatList
        // $FlowFixMe
        ref={flatListRef}
        data={distribution.list}
        renderItem={renderItem}
        keyExtractor={item => item.currency.id}
        contentContainerStyle={styles.root}
      />
    </SafeAreaView>
  );
}

export function Header({
  distribution,
  highlight,
  onHighlightChange,
}: {
  distribution: AssetsDistribution,
  highlight: number,
  onHighlightChange: (index: number) => void,
}) {
  const { t } = useTranslation();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const size = Dimensions.get("window").width / 3;

  return (
    <View>
      <View style={styles.header}>
        <View style={[styles.chartWrapper, { height: size }]}>
          <RingChart
            size={size}
            onHighlightChange={onHighlightChange}
            highlight={highlight}
            data={distribution.list}
          />
          <View style={styles.assetWrapper} pointerEvents="none">
            <LText semiBold style={styles.assetCount}>
              {distribution.list.length}
            </LText>
            <LText semiBold style={styles.assets}>
              {t("distribution.assets", { count: distribution.list.length })}
            </LText>
          </View>
        </View>
        <View style={styles.total}>
          <LText semiBold style={styles.label}>
            {t("distribution.total")}
          </LText>
          <LText semiBold style={styles.amount}>
            <CurrencyUnitValue
              unit={counterValueCurrency.units[0]}
              value={distribution.sum}
            />
          </LText>
        </View>
      </View>
      <LText bold secondary style={styles.distributionTitle}>
        {t("distribution.list", { count: distribution.list.length })}
      </LText>
    </View>
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
