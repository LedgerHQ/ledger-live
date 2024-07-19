import { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { Web3HubTabStackParamList } from "LLM/features/Web3Hub/TabNavigator";
import type { Web3HubStackParamList } from "LLM/features/Web3Hub/Navigator";
import { BaseComposite } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";

export type MainProps = BaseComposite<
  NativeStackScreenProps<Web3HubTabStackParamList, ScreenName.Web3HubMain>
>;

export type SearchProps = BaseComposite<
  NativeStackScreenProps<Web3HubStackParamList, ScreenName.Web3HubSearch>
>;

export type AppProps = BaseComposite<
  NativeStackScreenProps<Web3HubStackParamList, ScreenName.Web3HubApp>
>;

export type TabsProps = BaseComposite<
  NativeStackScreenProps<Web3HubStackParamList, ScreenName.Web3HubTabs>
>;
