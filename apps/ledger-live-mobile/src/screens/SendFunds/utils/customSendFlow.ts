import type { ComponentType } from "react";
import type { BigNumber } from "bignumber.js";
import type { AccountLike, Account } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import type { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import perFamilySendFlow from "~/generated/customSendFlow";
import type { Props as BaseSummaryToSectionProps } from "~/screens/SendFunds/SummaryToSection";

export type CustomSendFlowScreen = {
  name: keyof SendFundsNavigatorStackParamList;
  // Screen components have typed route/navigation props that vary per screen name.
  // A generic bound isn't expressible without `any` due to contravariance.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: ComponentType<any>;
  options?: NativeStackNavigationOptions;
  initialParams?: Partial<SendFundsNavigatorStackParamList[keyof SendFundsNavigatorStackParamList]>;
};

type SendFundsNavigation = StackNavigatorProps<
  SendFundsNavigatorStackParamList,
  ScreenName.SendCoin
>["navigation"];

type SelectRecipientNavigation = StackNavigatorProps<
  SendFundsNavigatorStackParamList,
  ScreenName.SendSelectRecipient
>["navigation"];

export type SummaryToSectionProps = BaseSummaryToSectionProps & {
  account: AccountLike;
  parentAccount: Account | null | undefined;
};

export type AfterAmountInputProps = {
  account: AccountLike;
  transaction: Transaction;
  updateTransaction: (updater: (t: Transaction) => Transaction) => void;
  /** Bridge-estimated max-spendable value shown in the screen's "Total available" row; `null` until the first estimate resolves (and possibly stale while a new estimate is computing). */
  maxSpendable: BigNumber | null;
};

type InitialScreenNavParams = {
  navigation: SendFundsNavigation;
  account: AccountLike;
  parentAccount: Account | undefined;
  extra?: Record<string, unknown>;
};

type AfterRecipientNavParams = {
  navigation: SelectRecipientNavigation;
  account: AccountLike;
  parentAccount: Account | undefined;
  transaction: Transaction;
};

export type CustomSendFlow = {
  screens: CustomSendFlowScreen[];
  /** Declarative entrypoint for navigation from outside the SendFunds navigator (e.g. asset action buttons). */
  buildSendEntrypoint?: (opts: { account: AccountLike; parentAccount: Account | undefined }) => {
    screen: keyof SendFundsNavigatorStackParamList;
    params: Record<string, unknown>;
  };
  SummaryFromBadge?: ComponentType<{ transaction: Transaction }>;
  SummaryToBadge?: ComponentType<{ transaction: Transaction }>;
  SummaryToSection?: ComponentType<SummaryToSectionProps>;
  AfterAmountInput?: ComponentType<AfterAmountInputProps>;
  /** Suppresses the generic Amount + Fees "Total" row on the Summary screen (e.g. when the family renders its own inside SendRowsFee). */
  hideSummaryTotalSection?: boolean;
  /** Forces full, unrounded precision on amounts in the send flow instead of the default significant-digits rounding (e.g. the "total available" balance on the Amount screen). */
  showAllDigits?: boolean;
  /** Imperative navigation from within the SendFunds navigator after account selection. */
  navigateToInitialScreen?: (params: InitialScreenNavParams) => void;
  /** Imperative navigation from within the SendFunds navigator after recipient selection. */
  navigateAfterRecipient?: (params: AfterRecipientNavParams) => boolean;
};

const isCustomSendFlowFamily = (family: string): family is keyof typeof perFamilySendFlow =>
  Object.hasOwn(perFamilySendFlow, family);

export const getCustomSendFlow = (family: string): CustomSendFlow | null => {
  if (!isCustomSendFlowFamily(family)) return null;
  return perFamilySendFlow[family];
};
