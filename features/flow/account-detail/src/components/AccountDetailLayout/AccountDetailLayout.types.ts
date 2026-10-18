import type { ReactNode } from "react";

export type AccountDetailLayoutProps = Readonly<{
  hero: ReactNode;
  customPlace?: ReactNode;
  assets: ReactNode;
  transactions: ReactNode;
}>;
