import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import Touchable from "~/components/Touchable";

export type AddAccountDrawerProps = {
  isOpened: boolean;
  currency?: CryptoCurrency | TokenCurrency | null;
  doesNotHaveAccount?: boolean;
  onClose: () => void;
  reopenDrawer: () => void;
};

export type AddAccountDrawerRowProps = {
  title: string;
  description?: string;
  icon: React.ReactNode;
  testID?: string;
  onPress: React.ComponentProps<typeof Touchable>["onPress"];
};
