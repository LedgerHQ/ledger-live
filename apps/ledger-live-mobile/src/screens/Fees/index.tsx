import { Flex } from "@ledgerhq/native-ui";
import { FeeContainer } from "./FeeContainer";
import { SafeAreaView } from "react-native";
import { CustomFeesButton } from "./CustomFeesButton";
import { RootComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { FeesNavigatorParamsList } from "~/components/RootNavigator/types/FeesNavigator";
import { ScreenName } from "~/const";

export type Props = RootComposite<
  StackNavigatorProps<FeesNavigatorParamsList, ScreenName.FeeHomePage>
>;

export function FeesScreen({ route: { params } }: Props) {
  console.log("xxxxxxxxx", { params }, "xxxxxxxxx");

  return (
    <SafeAreaView>
      <Flex flexDirection="column" rowGap={12} margin={16} alignItems="stretch">
        <FeeContainer strategy="slow" active={false} onSelect={() => params.onSelect("slow")} />
        <FeeContainer strategy="medium" active={true} onSelect={() => params.onSelect("medium")} />
        <FeeContainer strategy="fast" active={false} onSelect={() => params.onSelect("fast")} />
        <CustomFeesButton />
      </Flex>
    </SafeAreaView>
  );
}
