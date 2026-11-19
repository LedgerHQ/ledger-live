import React from "react";
import HeaderBackButton from "LLM/components/Navigation/HeaderBackButton";
import HeaderTitle from "LLM/components/Navigation/HeaderTitle";

export const HEADER_BACK_BUTTON_TEST_ID = "header-back-button";
export const HEADER_TITLE_TEST_ID = "header-title";

export const wallet40HeaderOptions = {
  headerShown: true,
  headerTitle: () => <HeaderTitle titleKey="manager.title" testID={HEADER_TITLE_TEST_ID} />,
  headerLeft: () => <HeaderBackButton testID={HEADER_BACK_BUTTON_TEST_ID} />,
};
