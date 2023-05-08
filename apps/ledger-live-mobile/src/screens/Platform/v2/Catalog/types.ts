import { TextInput } from "react-native";
import {
  BaseComposite,
  StackNavigatorProps,
} from "../../../../components/RootNavigator/types/helpers";
import { DiscoverNavigatorStackParamList } from "../../../../components/RootNavigator/types/DiscoverNavigator";
import { ScreenName } from "../../../../const";

export type NavigationProps = BaseComposite<
  StackNavigatorProps<
    DiscoverNavigatorStackParamList,
    ScreenName.PlatformCatalog
  >
>;

export interface PlatformState {
  recentlyUsed: string[];
}

export interface SearchBarValues<Item> {
  inputRef: React.RefObject<TextInput>;
  input: string;
  result: Item[];
  isActive: boolean;
  isSearching: boolean;
  onChange: (value: string) => void;
  onFocus: () => void;
  onCancel: () => void;
}
