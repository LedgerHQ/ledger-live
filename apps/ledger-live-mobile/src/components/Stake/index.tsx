/* eslint-disable consistent-return */
import { useMemo, useLayoutEffect, useCallback } from "react";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation } from "@react-navigation/native";
import { Account } from "@ledgerhq/types-live";
import { listCurrencies, filterCurrencies } from "@ledgerhq/live-common/currencies/helpers";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { NavigatorName, ScreenName } from "../../const";
import perFamilyAccountActions from "../../generated/accountActions";
import logger from "../../logger";
import type { StackNavigatorProps, BaseComposite } from "../RootNavigator/types/helpers";
import type { StakeNavigatorParamList } from "../RootNavigator/types/StakeNavigator";

type Props = BaseComposite<StackNavigatorProps<StakeNavigatorParamList, ScreenName.Stake>>;

const StakeFlow = ({ route }: Props) => {
  const featureFlag = useFeature("stakePrograms");
  const currencies = route?.params?.currencies || featureFlag?.params?.list;
  const navigation = useNavigation<StackNavigationProp<{ [key: string]: object | undefined }>>();
  const parentRoute = route?.params?.parentRoute;
  const cryptoCurrencies = useMemo(() => {
    return filterCurrencies(listCurrencies(true), {
      currencies: currencies || [],
    });
  }, [currencies]);

  const onSuccess = useCallback(
    (account: Account, parentAccount?: Account) => {
      // @ts-expect-error issue in typing
      const decorators = perFamilyAccountActions[account?.currency?.family];
      const familySpecificMainActions =
        (decorators &&
          decorators.getMainActions &&
          decorators.getMainActions({
            account,
            parentAccount,
            colors: {},
            parentRoute,
          })) ||
        [];
      const stakeFlow = familySpecificMainActions.find(
        (action: { id: string }) => action.id === "stake",
      )?.navigationParams;
      if (!stakeFlow) return null;
      const [name, options] = stakeFlow;

      navigation.navigate(NavigatorName.Base, {
        screen: name,
        stakingDrawer: options?.stakingDrawer,
        params: {
          screen: options.screen,
          params: {
            ...(options?.params || {}),
            account,
            parentAccount,
          },
        },
      });
    },
    [navigation, parentRoute],
  );
  const onError = (error: Error) => {
    logger.critical(error);
  };

  const requestAccount = useCallback(() => {
    if (cryptoCurrencies.length === 1) {
      // Navigate to the second screen when there is only one currency
      navigation.replace(NavigatorName.RequestAccount, {
        screen: ScreenName.RequestAccountsSelectAccount,
        params: {
          currency: cryptoCurrencies[0],
          shouldNotPopNavigationOnSuccess: true,
          onSuccess,
        },
        onError,
      });
    } else {
      navigation.replace(NavigatorName.RequestAccount, {
        screen: ScreenName.RequestAccountsSelectCrypto,
        params: {
          currencies: cryptoCurrencies,
          allowAddAccount: true,
          shouldNotPopNavigationOnSuccess: true,
          onSuccess,
        },
        onError,
      });
    }
  }, [cryptoCurrencies, navigation, onSuccess]);

  useLayoutEffect(() => {
    requestAccount();
  }, [requestAccount]);

  return null;
};

export default StakeFlow;
