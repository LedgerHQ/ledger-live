import { IconsLegacy } from "@ledgerhq/native-ui";
import BigNumber from "bignumber.js";
import type { Operation } from "@ledgerhq/types-live";
import accountActions from "../accountActions";
import { ALEO_ACCOUNT_1, ALEO_TOKEN_ACCOUNT_1, makeAleoAccount } from "../__mocks__/account.mock";
import { aleoCurrency } from "../__mocks__/currency.mock";
import { getAleoCurrencyConfigById } from "@ledgerhq/live-common/families/aleo/config";
import { NavigatorName, ScreenName } from "~/const";
import ZeroBalanceDisabledModalContent from "~/components/FabActions/modals/ZeroBalanceDisabledModalContent";

jest.mock("@ledgerhq/native-ui", () => ({
  IconsLegacy: { TransferMedium: "TransferMedium", CoinsMedium: "CoinsMedium" },
}));

jest.mock("@ledgerhq/live-common/families/aleo/config", () => ({
  getAleoCurrencyConfigById: jest.fn(),
}));

jest.mock("~/components/FabActions/modals/ZeroBalanceDisabledModalContent", () => ({
  __esModule: true,
  default: "ZeroBalanceDisabledModalContent",
}));

jest.mock("~/context/Locale", () => ({
  i18n: { t: (key: string) => key },
}));

const mockGetAleoConfig = jest.mocked(getAleoCurrencyConfigById);

const mockStakingEnabled = (enableStaking: boolean) =>
  mockGetAleoConfig.mockReturnValue({
    status: { type: "active" },
    enableStaking,
  } as ReturnType<typeof getAleoCurrencyConfigById>);

beforeEach(() => {
  mockGetAleoConfig.mockReset();
  mockStakingEnabled(false);
});

describe("accountActions.getMainActions", () => {
  it("returns a single publicToPrivate action with correct shape", () => {
    const [action] = accountActions.getMainActions({ account: ALEO_ACCOUNT_1 });

    expect(action.id).toBe("public_to_private");
    expect(action.label).toBe("aleo.accountActions.publicToPrivate");
    expect(action.Icon).toBe(IconsLegacy.TransferMedium);
    expect(action.event).toBe("button_clicked");
    expect(action.eventProperties).toEqual({
      button: "public_to_private",
      currency: "ALEO",
      page: "Account Page",
    });
    expect(action.navigationParams).toEqual([
      NavigatorName.SendFunds,
      expect.objectContaining({
        screen: ScreenName.AleoSendBalanceSelection,
        params: expect.objectContaining({ isSelfTransfer: true }),
      }),
    ]);
  });

  it("is disabled with the zero-balance modal when account balance is zero", () => {
    const [action] = accountActions.getMainActions({
      account: { ...ALEO_ACCOUNT_1, balance: new BigNumber(0) },
    });

    expect(action.disabled).toBe(true);
    expect(action.modalOnDisabledClick?.component).toBe(ZeroBalanceDisabledModalContent);
  });

  it("uses a plain string label so ZeroBalanceDisabledModalContent can interpolate it as actionName", () => {
    const [action] = accountActions.getMainActions({ account: ALEO_ACCOUNT_1 });

    expect(typeof action.label).toBe("string");
  });

  it("is enabled when account balance is positive", () => {
    const [action] = accountActions.getMainActions({
      account: { ...ALEO_ACCOUNT_1, balance: new BigNumber(1000000) },
    });

    expect(action.disabled).toBe(false);
  });
});

const findStake = (account = ALEO_ACCOUNT_1) =>
  accountActions.getMainActions({ account }).find(action => action.id === "stake");

describe("accountActions.getMainActions and the enableStaking flag", () => {
  it("omits the stake action when staking is disabled", () => {
    expect(
      accountActions.getMainActions({ account: ALEO_ACCOUNT_1 }).map(action => action.id),
    ).toEqual(["public_to_private"]);
  });

  it("omits the stake action when the currency configuration cannot be resolved", () => {
    mockGetAleoConfig.mockReturnValue(undefined);

    expect(findStake()).toBeUndefined();
  });

  it("returns the stake action first when staking is enabled", () => {
    mockStakingEnabled(true);

    const actions = accountActions.getMainActions({ account: ALEO_ACCOUNT_1 });

    expect(actions.map(action => action.id)).toEqual(["stake", "public_to_private"]);
    expect(actions[0].navigationParams).toEqual([
      NavigatorName.AleoBondPublicFlow,
      {
        screen: ScreenName.AleoBondPublicSelectValidator,
        params: { accountId: ALEO_ACCOUNT_1.id, parentId: undefined },
      },
    ]);
  });

  it("disables the stake action when the account holds no public funds", () => {
    mockStakingEnabled(true);

    const action = findStake(makeAleoAccount({ transparentBalance: new BigNumber(0) }));

    expect(action?.disabled).toBe(true);
    expect(action?.modalOnDisabledClick?.component).toBe(ZeroBalanceDisabledModalContent);
  });

  it("enables the stake action when the account holds public funds", () => {
    mockStakingEnabled(true);

    const action = findStake(makeAleoAccount({ transparentBalance: new BigNumber(2_000_000) }));

    expect(action?.disabled).toBe(false);
  });

  it("disables the stake action while a bond is pending, without the zero-balance modal", () => {
    mockStakingEnabled(true);
    const funded = makeAleoAccount({ transparentBalance: new BigNumber(2_000_000) });

    const action = findStake({
      ...funded,
      pendingOperations: [{ type: "BOND" } as Operation],
    });

    expect(action?.disabled).toBe(true);
    expect(action?.modalOnDisabledClick).toBeUndefined();
  });

  describe("on a token account", () => {
    const funded = makeAleoAccount({ transparentBalance: new BigNumber(2_000_000) });
    const tokenActions = () =>
      accountActions.getMainActions({
        account: ALEO_TOKEN_ACCOUNT_1 as unknown as typeof funded,
        parentAccount: funded,
      });

    it("reads the configuration off the main account instead of throwing", () => {
      mockStakingEnabled(true);

      expect(tokenActions).not.toThrow();
      expect(mockGetAleoConfig).toHaveBeenCalledWith(funded.currency.id);
    });

    it("offers no stake action, since only the main account can bond", () => {
      mockStakingEnabled(true);

      expect(tokenActions().map(action => action.id)).toEqual(["public_to_private"]);
    });
  });
});

describe("accountActions.getExtraSendActionParams", () => {
  it("returns navigationParams pointing to AleoSendBalanceSelection with isSelfTransfer: false", () => {
    const result = accountActions.getExtraSendActionParams({
      account: ALEO_ACCOUNT_1,
    });

    expect(result.navigationParams).toEqual([
      NavigatorName.SendFunds,
      expect.objectContaining({
        screen: ScreenName.AleoSendBalanceSelection,
        params: expect.objectContaining({ isSelfTransfer: false }),
      }),
    ]);
  });
});

describe("accountActions.getAdditionalAssetActions", () => {
  it("with defaultAccount — navigates to AleoSendBalanceSelection with isSelfTransfer: true", () => {
    const [action] = accountActions.getAdditionalAssetActions({
      currency: aleoCurrency,
      defaultAccount: ALEO_ACCOUNT_1,
      parentAccount: undefined,
    });

    expect(action.navigationParams).toEqual([
      NavigatorName.SendFunds,
      expect.objectContaining({
        screen: ScreenName.AleoSendBalanceSelection,
        params: expect.objectContaining({ isSelfTransfer: true }),
      }),
    ]);
  });

  it("without defaultAccount — navigates to SendCoin with extra.isSelfTransfer: true", () => {
    const [action] = accountActions.getAdditionalAssetActions({
      currency: aleoCurrency,
      defaultAccount: undefined,
      parentAccount: undefined,
    });

    expect(action.navigationParams).toEqual([
      NavigatorName.SendFunds,
      expect.objectContaining({
        screen: ScreenName.SendCoin,
        params: expect.objectContaining({
          extra: expect.objectContaining({ isSelfTransfer: true }),
        }),
      }),
    ]);
  });

  it("is disabled when defaultAccount balance is zero", () => {
    const [action] = accountActions.getAdditionalAssetActions({
      currency: aleoCurrency,
      defaultAccount: { ...ALEO_ACCOUNT_1, balance: new BigNumber(0) },
      parentAccount: undefined,
    });

    expect(action.disabled).toBe(true);
  });

  it("leaves disabled unset when there is no defaultAccount", () => {
    const [action] = accountActions.getAdditionalAssetActions({
      currency: aleoCurrency,
      defaultAccount: undefined,
      parentAccount: undefined,
    });

    expect(action.disabled).toBeUndefined();
  });

  it("is enabled when defaultAccount balance is positive", () => {
    const [action] = accountActions.getAdditionalAssetActions({
      currency: aleoCurrency,
      defaultAccount: { ...ALEO_ACCOUNT_1, balance: new BigNumber(1000000) },
      parentAccount: undefined,
    });

    expect(action.disabled).toBe(false);
  });
});
