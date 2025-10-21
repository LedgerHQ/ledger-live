import { useRoute } from "@react-navigation/native";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { cryptoAssetsHooks } from "~/config/bridge-setup";

type NavigationProps = StackNavigatorProps<{
  [key: string]: { currencyId: string };
}>;

const useCurrency = () => {
  const route = useRoute<NavigationProps["route"]>();
  const { currencyId } = route.params;
  const { currency } = cryptoAssetsHooks.useCurrencyById(currencyId || "");

  if (!currency) {
    throw new Error(`currency with id "${currencyId}" not found`);
  }

  return currency;
};

export default useCurrency;
