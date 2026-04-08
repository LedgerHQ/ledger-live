import React, { type ComponentProps, useCallback, useMemo } from "react";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import BackButton from "LLM/features/Web3Hub/components/BackButton";
import type { MainProps } from "LLM/features/Web3Hub/types";
import TextInput from "~/components/TextInput";
import { NavigatorName, ScreenName } from "~/const";

type SearchInputProps = Pick<ComponentProps<typeof TextInput>, "inputContainerStyle" | "renderLeft">;

const inputWithBackButtonStyle = {
  paddingLeft: 0,
};

export default function useWeb3HubMainHeaderViewModel(navigation: MainProps["navigation"]) {
  const lwmWallet40 = useFeature("lwmWallet40");
  const isWalletV4Enabled = lwmWallet40?.enabled === true;

  const goToSearch = useCallback(() => {
    navigation.push(NavigatorName.Web3Hub, {
      screen: ScreenName.Web3HubSearch,
    });
  }, [navigation]);

  const searchInputProps = useMemo<SearchInputProps>(
    () =>
      isWalletV4Enabled
        ? {
            inputContainerStyle: inputWithBackButtonStyle,
            renderLeft: <BackButton onPress={navigation.goBack} />,
          }
        : {},
    [isWalletV4Enabled, navigation],
  );

  return {
    goToSearch,
    isWalletV4Enabled,
    searchInputProps,
  };
}
