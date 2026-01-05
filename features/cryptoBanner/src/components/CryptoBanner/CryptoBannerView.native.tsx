import React, { useEffect, useRef } from "react";
import { View, Text, ScrollView, StyleSheet, Animated, Easing } from "react-native";
import { TopCrypto } from "../../data-layer/api/types";

interface CryptoBannerViewProps {
  topCryptos: TopCrypto[];
  isEnabled: boolean;
  autoScroll: boolean;
  scrollSpeed: number;
  isLoading: boolean;
  error: unknown;
  onToggleBanner: () => void;
  onToggleAutoScroll: () => void;
  onRefresh: () => void;
}

export const CryptoBannerView = ({
  topCryptos,
  isEnabled,
  autoScroll,
  scrollSpeed,
  isLoading,
  error,
}: CryptoBannerViewProps) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!autoScroll) return;

    const animation = Animated.loop(
      Animated.timing(scrollX, {
        toValue: -1000,
        duration: scrollSpeed * 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [autoScroll, scrollSpeed, scrollX]);

  if (!isEnabled) return null;

  if (isLoading) {
    return (
      <View style={styles.banner}>
        <Text style={styles.loadingText}>Loading market data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.banner, styles.errorBanner]}>
        <Text style={styles.errorText}>Unable to load market data</Text>
      </View>
    );
  }

  const cryptoItems = [...topCryptos, ...topCryptos];

  return (
    <View style={styles.banner}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={!autoScroll}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View style={[styles.content, { transform: [{ translateX: scrollX }] }]}>
          {cryptoItems.map((crypto, index) => (
            <View key={`${crypto.id}-${index}`} style={styles.cryptoItem}>
              <Text style={styles.ticker}>{crypto.ticker}</Text>
              {crypto.price && (
                <Text style={styles.price}>
                  $
                  {crypto.price.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              )}
              {crypto.priceChangePercentage24h !== undefined && (
                <Text
                  style={[
                    styles.change,
                    crypto.priceChangePercentage24h >= 0 ? styles.positive : styles.negative,
                  ]}
                >
                  {crypto.priceChangePercentage24h >= 0 ? "+" : ""}
                  {crypto.priceChangePercentage24h.toFixed(2)}%
                </Text>
              )}
            </View>
          ))}
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    width: "100%",
    backgroundColor: "blue",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: "row",
    gap: 48,
  },
  cryptoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginRight: 48,
  },
  ticker: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#60a5fa",
    fontFamily: "Courier New",
  },
  price: {
    fontSize: 14,
    color: "#e5e5e5",
    fontFamily: "Courier New",
  },
  change: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Courier New",
  },
  positive: {
    color: "#10b981",
  },
  negative: {
    color: "#ef4444",
  },
  loadingText: {
    textAlign: "center",
    color: "#e5e5e5",
    fontSize: 14,
  },
  errorBanner: {
    backgroundColor: "#ef4444",
  },
  errorText: {
    textAlign: "center",
    color: "#ffffff",
    fontSize: 14,
  },
});
