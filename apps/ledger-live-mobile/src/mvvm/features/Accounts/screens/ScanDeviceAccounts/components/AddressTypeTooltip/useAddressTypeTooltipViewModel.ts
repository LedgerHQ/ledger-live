import { useCallback, useState } from "react";
import type { DerivationMode } from "@ledgerhq/types-live";
import { track } from "~/analytics";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Linking } from "react-native";
import { urls } from "~/utils/urls";

export type Props = {
  accountSchemes: Array<DerivationMode> | null | undefined;
  currency: CryptoCurrency;
};

export default function useAddressTypeTooltipViewModel({ accountSchemes, currency }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const onOpen = useCallback(() => {
    track("AddAccountsAddressTypeTooltip");
    setIsOpen(true);
  }, []);

  const onClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const onClickLearnMore = useCallback(() => {
    track("AddAccountsSupportLink_AddressType");
    Linking.openURL(urls.bitcoinAddressType);
  }, []);

  const displayLearnMoreButton = currency?.family === "bitcoin";

  const formattedAccountSchemes = accountSchemes
    ? accountSchemes.map(a => (a === "" ? "legacy" : a))
    : [];

  return {
    isOpen,
    formattedAccountSchemes,
    currency,
    displayLearnMoreButton,
    onOpen,
    onClose,
    onClickLearnMore,
  };
}
