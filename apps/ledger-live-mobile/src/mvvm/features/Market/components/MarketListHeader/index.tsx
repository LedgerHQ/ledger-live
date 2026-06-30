import React from "react";
import HeaderTitle from "LLM/components/Navigation/HeaderTitle";
import HeaderBackButton from "LLM/components/Navigation/HeaderBackButton";

export function MarketListHeaderLeft() {
  return <HeaderBackButton testID="market-list-header-left" />;
}

export function MarketListHeaderTitle() {
  return <HeaderTitle testID="market-list-header-title" titleKey="market.title" />;
}
