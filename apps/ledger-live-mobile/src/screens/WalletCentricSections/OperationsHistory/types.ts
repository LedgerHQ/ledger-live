import { AccountLikeArray, DailyOperationsSection } from "@ledgerhq/types-live";
import { TFunction } from "i18next";

export type InitialProps = {
  accounts: AccountLikeArray;
  testID?: string;
};

export type Props = InitialProps & {
  sections?: DailyOperationsSection[];
  completed?: boolean;
  opCount: number;
  skipOp?: number;
  goToAnalyticsOperations?: () => void;
  t?: TFunction;
};

export type ViewProps = InitialProps & {
  sections: DailyOperationsSection[];
  completed: boolean;
  goToAnalyticsOperations?: () => void;
  t?: TFunction;
};
