import { Account } from "@ledgerhq/types-live";

import { STATUS } from "~/renderer/screens/WalletConnect/Provider";
export type BodyProps = {
  onClose: Function;
  link: string;
};
export type FooterProps = {
  account: Account | undefined | null;
  wcStatus: STATUS;
  onContinue: Function;
  onReject: Function;
  onCancel: Function;
};
