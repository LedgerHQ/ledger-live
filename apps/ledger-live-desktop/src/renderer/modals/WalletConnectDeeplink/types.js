// @flow
import type { Account } from "@ledgerhq/types-live";
// $FlowFixMe
import { STATUS } from "~/renderer/screens/WalletConnect/Provider";

export type BodyProps = {
  onClose: Function,
  link: string,
};

export type FooterProps = {
  account: ?Account,
  wcStatus: STATUS,
  onContinue: Function,
  onReject: Function,
  onCancel: Function,
};
