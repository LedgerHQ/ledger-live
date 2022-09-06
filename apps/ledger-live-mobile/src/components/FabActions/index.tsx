import React, { ComponentType, ReactElement, ReactNode } from "react";
import { AccountLike, Account } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

export type ModalOnDisabledClickComponentProps = {
  account?: AccountLike;
  parentAccount?: Account;
  currency?: CryptoCurrency;
  isOpen?: boolean;
  onClose: () => void;
  action: {
    label: ReactNode;
  };
};

export type ActionButtonEventProps = {
  navigationParams?: any[];
  linkUrl?: string;
  confirmModalProps?: {
    withCancel?: boolean;
    id?: string;
    title?: string | ReactElement;
    desc?: string | ReactElement;
    Icon?: ComponentType;
    children?: ReactNode;
    confirmLabel?: string | ReactElement;
    confirmProps?: any;
  };
  modalOnDisabledClick?: {
    component: React.ComponentType<ModalOnDisabledClickComponentProps>;
  };
  Component?: ComponentType;
  enableActions?: string;
};

export type ActionButton = ActionButtonEventProps & {
  label: string;
  Icon?: ComponentType<{ size: number; color: string }>;
  event: string;
  eventProperties?: { [key: string]: any };
  Component?: ComponentType;
  type?: string;
  outline?: boolean;
  disabled?: boolean;
};
