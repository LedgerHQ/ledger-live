import type { ReactNode } from "react";

export type AccountDetailLayoutProps = Readonly<{
  hero: ReactNode;
  customPlace?: ReactNode;
  analyticsNotice?: ReactNode;
  assets: ReactNode;
  transactions: ReactNode;
}>;
