import { NavigatorName, ScreenName } from "~/const";
import { MainProps, SearchProps } from "LLM/features/Web3Hub/types";

export default function goToApp(
  navigation: SearchProps["navigation"] | MainProps["navigation"],
  manifestId: string,
) {
  navigation.push(NavigatorName.Web3Hub, {
    screen: ScreenName.Web3HubApp,
    params: {
      manifestId: manifestId,
    },
  });
}
