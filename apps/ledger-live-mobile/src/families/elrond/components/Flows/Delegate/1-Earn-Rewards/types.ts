import type { NavigationProp, ParamListBase } from "@react-navigation/native";

interface EarnRewardsPropsType {
  navigation: NavigationProp<ParamListBase>;
  route: {
    params: {
      accountId: string;
    };
  };
}

export type { EarnRewardsPropsType };
