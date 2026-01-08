import React from "react";
import { ScrollView, ActivityIndicator, Image } from "react-native";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { useMarketPerformers } from "@ledgerhq/live-common/market/hooks/useMarketPerformers";
import type { MarketItemPerformer } from "@ledgerhq/live-common/market/utils/types";

export const MarketBanner = () => {
  const { data, isLoading, isError } = useMarketPerformers({
    counterCurrency: "usd",
    range: "day",
    limit: 10,
    top: 50,
    sort: "desc", // top gainers
    supported: true,
    refreshRate: 1, // refresh every minute
  });

  if (isLoading) {
    return (
      <Box
        lx={{
          backgroundColor: "accent",
          padding: "s16",
          borderRadius: "md",
          marginBottom: "s16",
          alignItems: "center",
          justifyContent: "center",
          gap: "s8",
        }}
      >
        <ActivityIndicator size="small" color="white" />
        <Text typography="body1" lx={{ color: "onAccent" }}>
          {"📊 Market Top Performers"}
        </Text>
        <Text typography="body2" lx={{ color: "onAccent" }}>
          Loading...
        </Text>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box
        lx={{
          backgroundColor: "error",
          padding: "s16",
          borderRadius: "md",
          marginBottom: "s16",
          gap: "s8",
        }}
      >
        <Text typography="body1" lx={{ color: "error" }}>
          {"⚠️ Market Banner"}
        </Text>
        <Text typography="body2" lx={{ color: "error" }}>
          {"Failed to load market data"}
        </Text>
      </Box>
    );
  }

  return (
    <Box
      lx={{
        backgroundColor: "canvas",
        padding: "s16",
        borderRadius: "md",
        marginBottom: "s16",
        gap: "s12",
      }}
    >
      <Text typography="body1" lx={{ color: "base" }}>
        {"🚀 Top Gainers (24h)"}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {data?.slice(0, 1).map((coin: MarketItemPerformer) => (
          <Box
            key={coin.id}
            lx={{
              backgroundColor: "accent",
              padding: "s12",
              borderRadius: "md",
              width: "s96",
              marginRight: "s16",
              gap: "s8",
            }}
          >
            <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s8" }}>
              {coin.image && (
                <Image
                  source={{ uri: coin.image }}
                  style={{ width: 24, height: 24, borderRadius: 12 }}
                />
              )}
              <Box lx={{ flex: 1, gap: "s4" }}>
                <Text typography="body1" lx={{ color: "base" }}>
                  {coin.ticker}
                </Text>
                <Text typography="body2" lx={{ color: "muted" }} numberOfLines={1}>
                  {coin.name}
                </Text>
              </Box>
            </Box>
            <Text typography="body1" lx={{ color: "base" }}>
              ${coin.price.toFixed(2)}
            </Text>
            <Text
              typography="body1"
              lx={{
                color: coin.priceChangePercentage24h >= 0 ? "success" : "error",
              }}
            >
              {coin.priceChangePercentage24h >= 0 ? "↑" : "↓"}{" "}
              {Math.abs(coin.priceChangePercentage24h).toFixed(2)}%
            </Text>
          </Box>
        ))}
      </ScrollView>
      <Text typography="body2" lx={{ color: "muted", marginTop: "s12" }}>
        {"🔥 Hot Reload is working! • Data refreshes every minute"}
      </Text>
    </Box>
  );
};
