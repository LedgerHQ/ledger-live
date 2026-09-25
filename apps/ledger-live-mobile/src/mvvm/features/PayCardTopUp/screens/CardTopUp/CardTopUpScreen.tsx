import React, { useCallback, useLayoutEffect, useMemo } from "react";
import type { Account } from "@ledgerhq/types-live";
import { CardTopUpHeaderTitle } from "@features/flow-pay-card-top-up";
import type { RootComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { ScreenName } from "~/const";
import { useSelector } from "~/context/hooks";
import { flattenAccountsSelector } from "~/reducers/accounts";
import { CardTopUpView } from "./CardTopUpView";
import { useCardTopUpViewModel, type CardTopUpData } from "./useCardTopUpViewModel";

type NavigationProps = RootComposite<
  StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.PayCardTopUp>
>;

function CardTopUpContent({
  data,
  navigation,
}: Readonly<{ data: CardTopUpData; navigation: NavigationProps["navigation"] }>) {
  const showSigned = useCallback(
    () => navigation.replace(ScreenName.PayCardTopUpSigned),
    [navigation],
  );
  const viewModel = useCardTopUpViewModel(data, showSigned);
  const { title, headerDescription } = viewModel;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => <CardTopUpHeaderTitle title={title} description={headerDescription} />,
    });
  }, [headerDescription, navigation, title]);

  return <CardTopUpView {...viewModel} />;
}

export default function CardTopUpScreen({ navigation, route }: NavigationProps) {
  const { accountId, destination } = route.params;
  const accounts = useSelector(flattenAccountsSelector);

  const data = useMemo<CardTopUpData | null>(() => {
    const account = accounts.find(candidate => candidate.id === accountId);
    if (!account) return null;
    if (account.type !== "TokenAccount") return { account, destination };

    const parentAccount = accounts.find(
      (candidate): candidate is Account =>
        candidate.type === "Account" && candidate.id === account.parentId,
    );
    return parentAccount ? { account, parentAccount, destination } : null;
  }, [accountId, accounts, destination]);

  if (!data) return null;

  return <CardTopUpContent data={data} navigation={navigation} />;
}
