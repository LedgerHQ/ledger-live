import React, { useMemo } from "react";
import { Box } from "@ledgerhq/native-ui";
import { useWallet40Theme } from "LLM/hooks/useWallet40Theme";
import { PortfolioBalanceSync } from "LLM/features/Portfolio/components/PortfolioBalanceSync";
import { Portfolio, ReadOnlyPortfolio } from "LLM/features/Portfolio";
import { useSelector } from "~/context/hooks";
import { ScreenName } from "~/const/navigation";
import { hasNoAccountsSelector } from "~/reducers/accounts";
import { readOnlyModeEnabledSelector } from "~/reducers/settings";
import WalletTabBackgroundGradient from "../WalletTab/WalletTabBackgroundGradient";
import WalletTabNavigatorScrollManager from "../WalletTab/WalletTabNavigatorScrollManager";
import { BaseComposite, StackNavigatorProps } from "./types/helpers";
import { PortfolioNavigatorStackParamList } from "./types/PortfolioNavigator";

type NavigationProps = BaseComposite<
  StackNavigatorProps<PortfolioNavigatorStackParamList, ScreenName.Portfolio>
>;

// Root screen of the portfolio area (the Market tab moved to a standalone destination,
// so this is no longer a nested tab navigator). The Portfolio screen is rendered directly
// here, wrapped in the portfolio chrome, under the ScreenName.Portfolio route.
export default function PortfolioRootScreen({ navigation, route }: NavigationProps) {
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const hasNoAccounts = useSelector(hasNoAccountsSelector);

  const { backgroundColor } = useWallet40Theme();

  const PortfolioComponent = useMemo(
    () => (readOnlyModeEnabled && hasNoAccounts ? ReadOnlyPortfolio : Portfolio),
    [readOnlyModeEnabled, hasNoAccounts],
  );

  return (
    <WalletTabNavigatorScrollManager currentRouteName={ScreenName.Portfolio}>
      <PortfolioBalanceSync />
      <Box flexGrow={1} bg={backgroundColor}>
        <WalletTabBackgroundGradient />
        <PortfolioComponent navigation={navigation} route={route} />
      </Box>
    </WalletTabNavigatorScrollManager>
  );
}
