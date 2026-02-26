import React from "react";
import HeaderBackButton from "LLM/components/Navigation/HeaderBackButton";
import HeaderTitle from "LLM/components/Navigation/HeaderTitle";

export const wallet40HeaderOptions = {
  headerShown: true,
  headerTitle: () => <HeaderTitle titleKey="manager.title" />,
  headerLeft: () => <HeaderBackButton />,
};
