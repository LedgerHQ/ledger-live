import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { BaseComposite, MainComposite } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";

export type Web3HubTabStackParamList = {
  [ScreenName.Web3HubMain]: undefined;
};

export type Web3HubTabScreenProps<T extends keyof Web3HubTabStackParamList> = MainComposite<
  NativeStackScreenProps<Web3HubTabStackParamList, T>
>;

export type Web3HubStackParamList = {
  [ScreenName.Web3HubSearch]: undefined;
  [ScreenName.Web3HubTabs]: undefined;
  [ScreenName.Web3HubApp]: {
    manifestId: string;
    queryParams?: Record<string, string | undefined>;
  };
};

export type Web3HubScreenProps<T extends keyof Web3HubStackParamList> = BaseComposite<
  NativeStackScreenProps<Web3HubStackParamList, T>
>;

export type MainProps = Web3HubTabScreenProps<ScreenName.Web3HubMain>;

export type SearchProps = Web3HubScreenProps<ScreenName.Web3HubSearch>;

export type AppProps = Web3HubScreenProps<ScreenName.Web3HubApp>;

export type TabsProps = Web3HubScreenProps<ScreenName.Web3HubTabs>;

export type Web3HubDB = {
  recentlyUsed: RecentlyUsed[];
  dismissedManifests: DismissedManifests;
  // localLiveApp: LiveAppManifest[];
};

export type RecentlyUsed = {
  id: string;
  usedAt: string;
};

export type DismissedManifests = {
  [id: string]: boolean;
};

export type TabData = {
  id: string;
  manifestId: string;
  icon: string | null | undefined;
  title: string;
  previewUri: string;
  url: string | URL;
};
