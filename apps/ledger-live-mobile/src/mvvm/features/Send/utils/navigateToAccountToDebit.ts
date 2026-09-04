import type { ContactAddress } from "@domain/entity-contact";
import { NavigatorName, ScreenName } from "~/const";

type NavigateToAccountToDebit = {
  navigate: (
    name: typeof NavigatorName.SendFunds,
    params: {
      screen: typeof ScreenName.SendCoin;
      params: {
        currencyIds: string[];
        extra: { recipient: string; skipRecipientStep: true };
      };
    },
  ) => void;
};

export function navigateToAccountToDebit(
  navigation: NavigateToAccountToDebit,
  address: ContactAddress,
) {
  navigation.navigate(NavigatorName.SendFunds, {
    screen: ScreenName.SendCoin,
    params: {
      currencyIds: [address.currencyId],
      extra: {
        recipient: address.address,
        skipRecipientStep: true,
      },
    },
  });
}
