import React, { memo } from "react";
import { CompositeScreenProps } from "@react-navigation/core";
import {
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import TransactionAlreadyValidatedErrorView from "~/components/EditTransaction/TransactionAlreadyValidatedErrorView";
import { EditTransactionParamList } from "./EditTransactionParamList";
import { ScreenName } from "~/const";

type Props = CompositeScreenProps<
  StackNavigatorProps<EditTransactionParamList, ScreenName.TransactionAlreadyValidatedError>,
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
