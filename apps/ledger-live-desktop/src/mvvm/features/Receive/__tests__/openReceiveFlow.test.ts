import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { fetchAccountData } from "@domain/api-account-data";
import { selectFeature } from "@shared/feature-flags";
import { openReceiveAddressDialog } from "~/renderer/reducers/receiveFlow";
import { openAssetAndAccountDialog } from "../../ModularDialog/Web3AppWebview/AssetAndAccountDrawer";
import { openReceiveFlow } from "../openReceiveFlow";
import { selectAccountEntry, selectAccountUUIDOfLegacyAccount } from "../receiveAccount";

jest.mock("@shared/feature-flags", () => ({
  ...jest.requireActual("@shared/feature-flags"),
  selectFeature: jest.fn(),
}));
jest.mock("@domain/api-account-data", () => ({ fetchAccountData: jest.fn() }));
jest.mock("../../ModularDialog/Web3AppWebview/AssetAndAccountDrawer", () => ({
  openAssetAndAccountDialog: jest.fn(),
}));
jest.mock("~/renderer/families", () => ({ importLLDCoinFamily: jest.fn().mockResolvedValue({}) }));
jest.mock("~/renderer/reducers/onboarding", () => ({ onboardingReceiveFlowSelector: () => false }));
jest.mock("../receiveAccount", () => ({
  selectAccountEntry: jest.fn(),
  selectAccountUUIDOfLegacyAccount: jest.fn(),
}));

const account = genAccount("open-receive-flow");
const descriptor = mockAddressAccountDescriptor();
const accountUUID = computeAccountUUID(descriptor);

describe("openReceiveFlow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(selectFeature)
      .mockImplementation(
        (_state, key) =>
          (key === "newReceiveFlow"
            ? { enabled: true, params: { excludedFamilies: [] } }
            : { enabled: false }) as never,
      );
    jest.mocked(selectAccountUUIDOfLegacyAccount).mockReturnValue(accountUUID);
    jest.mocked(selectAccountEntry).mockReturnValue({ accountUUID, descriptor });
  });

  it("opens the address dialog without waiting for the receive data", async () => {
    const dispatch = jest.fn();
    const getState = () => ({ featureFlags: { resolved: {} } }) as never;

    openReceiveFlow({ account })(dispatch, getState, undefined);

    await new Promise(resolve => setImmediate(resolve));
    expect(dispatch).toHaveBeenCalledWith(
      openReceiveAddressDialog({
        accountUUID,
        assetId: account.currency.id as never,
        source: undefined,
      }),
    );
    expect(fetchAccountData).not.toHaveBeenCalled();
  });

  describe("asset detail page (assets, no account) with Noah on", () => {
    beforeEach(() => {
      jest.mocked(selectFeature).mockImplementation(
        (_state, key) =>
          ({
            newReceiveFlow: { enabled: true, params: { excludedFamilies: [] } },
            noah: { enabled: true, params: { activeCurrencyIds: ["ethereum/erc20/usd__coin"] } },
          })[key as string] as never,
      );
    });

    it("opens the asset dialog of the new flow when no asset has a bank transfer option", () => {
      const dispatch = jest.fn();
      const getState = () => ({ featureFlags: { resolved: {} } }) as never;

      openReceiveFlow({ currencyIds: ["bitcoin"] })(dispatch, getState, undefined);

      expect(openAssetAndAccountDialog).toHaveBeenCalledWith(
        expect.objectContaining({ currencies: ["bitcoin"], flow: "receive" }),
        dispatch,
      );
      expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ payload: expect.objectContaining({ name: "MODAL_RECEIVE" }) }),
      );
    });

    it("keeps the legacy modal and its options for a Noah asset", () => {
      const dispatch = jest.fn();
      const getState = () => ({ featureFlags: { resolved: {} } }) as never;

      openReceiveFlow({ currencyIds: ["ethereum/erc20/usd__coin"] })(dispatch, getState, undefined);

      expect(openAssetAndAccountDialog).not.toHaveBeenCalled();
    });
  });
});
