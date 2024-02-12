import { SearchRaw } from "@ledgerhq/live-common/hooks/useSearch";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import { TextInput } from "react-native";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { DiscoverNavigatorStackParamList } from "~/components/RootNavigator/types/DiscoverNavigator";
import { WalletConnectLiveAppNavigatorParamList } from "~/components/RootNavigator/types/WalletConnectLiveAppNavigator";
import { ScreenName } from "~/const";

export type NavigationProps = BaseComposite<
  StackNavigatorProps<DiscoverNavigatorStackParamList, ScreenName.PlatformCatalog>
> & {
  navigation: StackNavigatorProps<
    WalletConnectLiveAppNavigatorParamList,
    ScreenName.WalletConnectConnect
  >["navigation"]; // Only defined to make navigating to WalletConnect screen typed correctly
};

export type Search = SearchRaw<AppManifest, TextInput>;
