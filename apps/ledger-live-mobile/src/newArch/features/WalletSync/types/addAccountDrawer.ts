import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

export type AddAccountDrawerProps = {
  isOpened: boolean;
  currency?: CryptoCurrency | TokenCurrency | null;
  onClose: () => void;
  reopenDrawer: () => void;
};
