import { useListHeaderComponents } from "../ListHeaderComponent";
import { BalanceHistoryWithCountervalue, ValueChange } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { LayoutChangeEvent } from "react-native";
import { ColorPalette } from "@ledgerhq/native-ui";
import * as config from "@ledgerhq/live-common/config/index";
import { CurrencyConfig } from "@ledgerhq/coin-framework/config";
import type { Account, TokenAccount, Operation } from "@ledgerhq/types-live";
import { ActionButtonEvent } from "~/components/FabActions";
import * as featureFlagsIndex from "@ledgerhq/live-common/featureFlags/index";
import * as accountIndex from "@ledgerhq/live-common/account/index";
import type { TFunction } from "i18next";

/**
 * isAccountEmpty can not be spied because it is declared in multiple files
 * and overriden in ledger-live-common/src/account/helpers.ts
 */
const mockIsAccountEmpty = jest.requireMock("@ledgerhq/live-common/account/index").isAccountEmpty;

describe("Testing ListHeaderComponent Component", () => {
  describe("Testing disable delegation flag", () => {
    const ACCOUNT = {
      currency: {
        family: "bitcoin",
      } as CryptoCurrency,
      pendingOperations: [] as Operation[],
    } as Account;

    beforeEach(() => {
      jest.clearAllMocks();

      jest.spyOn(featureFlagsIndex, "useFeature").mockImplementation(jest.fn());
      jest
        .spyOn(accountIndex, "getMainAccount")
        .mockImplementation((account: TokenAccount | Account, _: unknown) => account as Account);

      mockIsAccountEmpty.mockImplementation(() => false);
    });

    it("should generate account earn header component when we do not disable delegation", () => {
      const { listHeaderComponents } = useListHeaderComponents({
        account: ACCOUNT,
        currency: {} as CryptoCurrency,
        currencyConfig: { disableDelegation: false } as unknown as CurrencyConfig,
        countervalueAvailable: false,
        useCounterValue: false,
        range: "all",
        history: {} as BalanceHistoryWithCountervalue,
        countervalueChange: {} as ValueChange,
        cryptoChange: {} as ValueChange,
        counterValueCurrency: {} as CryptoCurrency,
        onAccountPress: () => {},
        onSwitchAccountCurrency: () => {},
        onAccountCardLayout: (_event: LayoutChangeEvent) => {},
        colors: {
          background: {
            main: "#fff",
          },
        } as ColorPalette,
        secondaryActions: [
          {
            label: {} as React.ReactNode,
          } as ActionButtonEvent,
        ],
        t: (() => "") as unknown as TFunction,
      });

      expect(listHeaderComponents[7]).toBeDefined();
    });

    it("should generate account earn header component when disable delegation is not configured", () => {
      jest
        .spyOn(config, "getCurrencyConfiguration")
        .mockReturnValue({} as unknown as CurrencyConfig);

      const { listHeaderComponents } = useListHeaderComponents({
        account: ACCOUNT,
        currency: {} as CryptoCurrency,
        currencyConfig: {} as unknown as CurrencyConfig,
        countervalueAvailable: false,
        useCounterValue: false,
        range: "all",
        history: {} as BalanceHistoryWithCountervalue,
        countervalueChange: {} as ValueChange,
        cryptoChange: {} as ValueChange,
        counterValueCurrency: {} as CryptoCurrency,
        onAccountPress: () => {},
        onSwitchAccountCurrency: () => {},
        onAccountCardLayout: (_event: LayoutChangeEvent) => {},
        colors: {
          background: {
            main: "#fff",
          },
        } as ColorPalette,
        secondaryActions: [
          {
            label: {} as React.ReactNode,
          } as ActionButtonEvent,
        ],
        t: (() => "") as unknown as TFunction,
      });

      expect(listHeaderComponents[7]).toBeDefined();
    });

    it("should not generate account earn header component when we disable delegation", () => {
      const { listHeaderComponents } = useListHeaderComponents({
        account: ACCOUNT,
        currency: {} as CryptoCurrency,
        currencyConfig: { disableDelegation: true } as unknown as CurrencyConfig,
        countervalueAvailable: false,
        useCounterValue: false,
        range: "all",
        history: {} as BalanceHistoryWithCountervalue,
        countervalueChange: {} as ValueChange,
        cryptoChange: {} as ValueChange,
        counterValueCurrency: {} as CryptoCurrency,
        onAccountPress: () => {},
        onSwitchAccountCurrency: () => {},
        onAccountCardLayout: (_event: LayoutChangeEvent) => {},
        colors: {
          background: {
            main: "#fff",
          },
        } as ColorPalette,
        secondaryActions: [
          {
            label: {} as React.ReactNode,
          } as ActionButtonEvent,
        ],
        t: (() => "") as unknown as TFunction,
      });

      expect(listHeaderComponents[7]).toBeUndefined();
    });
  });
});
