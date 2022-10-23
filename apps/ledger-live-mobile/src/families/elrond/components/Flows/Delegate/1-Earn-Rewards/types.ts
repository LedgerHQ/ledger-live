import type { NavigationProp, ParamListBase } from "@react-navigation/native";

export interface EarnRewardsPropsType {
  navigation: NavigationProp<ParamListBase>;
  route: {
    params: {
      accountId: string;
    };
  };
}
