/* eslint-disable consistent-return */
import { useMemo, useLayoutEffect, useCallback } from "react";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation } from "@react-navigation/native";
import { Account } from "@ledgerhq/types-live";
import {
  listCurrencies,
  filterCurrencies,
} from "@ledgerhq/live-common/currencies/helpers";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { NavigatorName, ScreenName } from "../../const";
import perFamilyAccountActions from "../../generated/accountActions";
import logger from "../../logger";

const StakeFlow = () => {
  const featureFlag = useFeature("stakePrograms");
  const list = featureFlag?.params?.list;
  const navigation =
    useNavigation<StackNavigationProp<{ [key: string]: object | undefined }>>();
  const cryptoCurrencies = useMemo(() => {
    return filterCurrencies(listCurrencies(true), {
      currencies: list || [],
    });
  }, [list]);

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
          })) ||
        [];
      const stakeFlow = familySpecificMainActions.find(
        (action: { id: string }) => action.id === "stake",
      )?.navigationParams;
      if (!stakeFlow) return null;
      const [name, options] = stakeFlow;

      // TODO: Remove after Kiln stake implementation was be done
      if (
        account?.currency?.family === "ethereum" &&
        name === NavigatorName.Base
      ) {
        navigation.navigate(name, {
          screen: options.screen,
          params: {
            ...(options?.params || {}),
            accountId: account?.id,
            parentId: parentAccount?.id,
          },
        });
      } else {
        navigation.navigate(NavigatorName.Base, {
          screen: name,
          params: {
            screen: options.screen,
            params: {
              ...(options?.params || {}),
              account,
              parentAccount,
            },
          },
        });
      }
    },
    [navigation],
  );
  const onError = (error: Error) => {
    logger.critical(error);
  };

  const requestAccount = useCallback(() => {
    navigation.replace(NavigatorName.RequestAccount, {
      screen: ScreenName.RequestAccountsSelectCrypto,
      params: {
        currencies: cryptoCurrencies,
        allowAddAccount: true,
        onSuccess,
      },
      onError,
    });
  }, [cryptoCurrencies, navigation, onSuccess]);

  useLayoutEffect(() => {
    requestAccount();
  }, [requestAccount]);

  return null;
};

export default StakeFlow;
