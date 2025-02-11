import { getTypedTransaction } from "@ledgerhq/coin-evm/lib/transaction";
import { getEstimatedFees } from "@ledgerhq/coin-evm/logic";
import { useGasOptions } from "@ledgerhq/live-common/lib/families/evm/react";
import { Flex } from "@ledgerhq/native-ui";
import { SafeAreaView } from "react-native";
import { FeesNavigatorParamsList } from "~/components/RootNavigator/types/FeesNavigator";
import { RootComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { CustomFeesButton } from "./CustomFeesButton";
import { FeeContainer } from "./FeeContainer";

export type Props = RootComposite<
  StackNavigatorProps<FeesNavigatorParamsList, ScreenName.FeeHomePage>
>;

export function FeesScreen({ route: { params } }: Props) {
  const [gasOptions] = useGasOptions({
    currency: params.feePayingAccount.currency,
    transaction: params.transaction,
  });

  return (
    <SafeAreaView>
      <Flex flexDirection="column" rowGap={12} margin={16} alignItems="stretch">
        <FeeContainer
          feePayingAccount={params.feePayingAccount}
          strategy="slow"
          active={params.feesStrategy === "slow"}
          onSelect={() => {
            params.onSelect("slow", gasOptions?.slow ?? {});
          }}
          gasOption={
            gasOptions?.slow
              ? getEstimatedFees(getTypedTransaction(params.transaction, gasOptions?.slow))
              : undefined
          }
        />
        <FeeContainer
          feePayingAccount={params.feePayingAccount}
          strategy="medium"
          active={params.feesStrategy === "medium"}
          onSelect={() => params.onSelect("medium", gasOptions?.medium ?? {})}
          gasOption={
            gasOptions?.medium
              ? getEstimatedFees(getTypedTransaction(params.transaction, gasOptions?.medium))
              : undefined
          }
        />
        <FeeContainer
          feePayingAccount={params.feePayingAccount}
          strategy="fast"
          active={params.feesStrategy === "fast"}
          onSelect={() => params.onSelect("fast", gasOptions?.fast ?? {})}
          gasOption={
            gasOptions?.fast
              ? getEstimatedFees(getTypedTransaction(params.transaction, gasOptions?.fast))
              : undefined
          }
        />
        <CustomFeesButton />
      </Flex>
    </SafeAreaView>
  );
}
