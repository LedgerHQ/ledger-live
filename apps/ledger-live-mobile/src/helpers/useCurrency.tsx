import { useRoute } from "@react-navigation/native";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { useCurrencyById } from "@features/platform-currencies";

type NavigationProps = StackNavigatorProps<{
  [key: string]: { currencyId: string };
}>;

const useCurrency = () => {
  const route = useRoute<NavigationProps["route"]>();
  const { currencyId } = route.params;
  const { currency } = useCurrencyById(currencyId || "");

  if (!currency) {
    throw new Error(`currency with id "${currencyId}" not found`);
  }

  return currency;
};

export default useCurrency;
