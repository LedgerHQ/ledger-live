import type { AccountNotice } from "../../model/types";

export type AccountNoticesProps = Readonly<{
  notices: readonly AccountNotice[];
  onOpenLink: (link: string) => void;
  onOpenPerps: () => void;
  testID?: string;
}>;
