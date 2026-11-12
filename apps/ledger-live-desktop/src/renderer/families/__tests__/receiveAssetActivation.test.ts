import type { Account } from "@ledgerhq/types-live";
import { openModal } from "~/renderer/actions/modals";
import algorandAddAssetAction from "../algorand/addAssetAction";
import hederaAddAssetAction from "../hedera/addAssetAction";
import stellarAddAssetAction from "../stellar/addAssetAction";
import xrpAddAssetAction from "../xrp/addAssetAction";
import { XRP_ACCOUNT } from "../xrp/__mocks__/account.mock";
import { xrpIouToken } from "../xrp/__mocks__/currency.mock";

jest.mock("~/renderer/actions/modals", () => ({
  openModal: jest.fn((name: string, data: unknown) => ({ type: "MODAL_OPEN", name, data })),
}));

const account = XRP_ACCOUNT as unknown as Account;

describe("receive asset activation per family", () => {
  beforeEach(() => jest.clearAllMocks());

  it.each([
    ["algorand", algorandAddAssetAction, "MODAL_ALGORAND_OPT_IN", { account }],
    [
      "hedera",
      hederaAddAssetAction,
      "MODAL_HEDERA_RECEIVE_WITH_ASSOCIATION",
      { account, receiveTokenMode: true },
    ],
    ["stellar", stellarAddAssetAction, "MODAL_STELLAR_ADD_ASSET", { account }],
    ["xrp", xrpAddAssetAction, "MODAL_XRP_ADD_TOKEN", { account, token: xrpIouToken }],
  ])("%s opens its activation modal from the receive flow", (_family, action, modal, data) => {
    const dispatch = jest.fn();

    action({ account: account as never, dispatch, token: xrpIouToken });

    expect(openModal).toHaveBeenCalledWith(modal, data);
    expect(dispatch).toHaveBeenCalledTimes(1);
  });
});
