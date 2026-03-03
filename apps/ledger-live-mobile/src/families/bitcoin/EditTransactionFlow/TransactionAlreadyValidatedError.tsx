import React, { memo } from "react";
import { CompositeScreenProps } from "@react-navigation/core";
import TransactionAlreadyValidatedErrorView from "~/components/EditTransaction/TransactionAlreadyValidatedErrorView";
import type {
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { BitcoinEditTransactionParamList } from "./EditTransactionParamList";
import { ScreenName } from "~/const";

type Props = CompositeScreenProps<
  StackNavigatorProps<BitcoinEditTransactionParamList, ScreenName.TransactionAlreadyValidatedError>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

const TransactionAlreadyValidatedErrorComponent = ({ navigation, route }: Props) => {
  return (
    <TransactionAlreadyValidatedErrorView
      error={route.params.error}
      onClose={() => {
        navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
      }}
    />
  );
};

export const TransactionAlreadyValidatedError = memo<Props>(
  TransactionAlreadyValidatedErrorComponent,
);
