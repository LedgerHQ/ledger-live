import { getAccountBannerState } from "./banner";
import { MultiversxAccount, MultiversxDelegation, MultiversxProvider } from "./types";
import { BigNumber } from "bignumber.js";
import { MULTIVERSX_LEDGER_VALIDATOR_ADDRESS } from "./constants";

describe("getAccountBannerState", () => {
  it("returns the delegate banner when balance is not zero and there are no delegations", () => {
    const account = {
      spendableBalance: BigNumber("1000000000000000000000"),
      multiversxResources: {
        delegations: [],
      },
    };
    const multiversxPreloadData = {
      validators: [
        {
          contract: MULTIVERSX_LEDGER_VALIDATOR_ADDRESS,
          aprValue: 0.2,
        } as MultiversxProvider,
      ],
    };
    const result = getAccountBannerState(
      account as unknown as MultiversxAccount,
      multiversxPreloadData,
    );
    expect(result).toEqual({
      bannerType: "delegate",
    });
  });

  it("returns no banner when balance is zero and account already has delegations", () => {
    const account = {
      spendableBalance: BigNumber(0),
      multiversxResources: {
        delegations: [
          {
            validatorAddress: "validatorAddress",
          },
        ],
      },
    };
    const multiversxPreloadData = {
      validators: [
        {
          contract: MULTIVERSX_LEDGER_VALIDATOR_ADDRESS,
          aprValue: 0.2,
        } as MultiversxProvider,
      ],
    };
    const result = getAccountBannerState(
      account as unknown as MultiversxAccount,
      multiversxPreloadData,
    );
    expect(result).toEqual({
      bannerType: "hidden",
    });
  });

  it("returns no banner when there is no ledger validator", () => {
    const account = {
      spendableBalance: BigNumber(100),
      multiversxResources: {
        delegations: [
          {
            contract: "contract:a",
          } as MultiversxDelegation,
        ],
      },
    };
    const multiversxPreloadData = {
      validators: [
        {
          contract: "123",
        } as MultiversxProvider,
      ],
    };
    const result = getAccountBannerState(
      account as unknown as MultiversxAccount,
      multiversxPreloadData,
    );
    expect(result).toEqual({
      bannerType: "hidden",
    });
  });

  it("returns the redelegation banner when the ledger validator is not the worst validator", () => {
    const account = {
      spendableBalance: BigNumber(100),
      multiversxResources: {
        delegations: [
          {
            contract: "contract:a",
          } as MultiversxDelegation,
        ],
      },
    };
    const multiversxPreloadData = {
      validators: [
        {
          contract: "contract:a",
          aprValue: 0.1,
        } as MultiversxProvider,
        {
          contract: MULTIVERSX_LEDGER_VALIDATOR_ADDRESS,
          aprValue: 0.2,
        } as MultiversxProvider,
        {
          contract: "contract:b",
          aprValue: 0.3,
        } as MultiversxProvider,
      ],
    };
    const result = getAccountBannerState(
      account as unknown as MultiversxAccount,
      multiversxPreloadData,
    );
    expect(result).toEqual({
      bannerType: "redelegate",
      worstDelegation: {
        contract: "contract:a",
      },
    });
  });

  it("returns the delegation banner when ledger is the worst validator and the account balance is not zero", () => {
    const account = {
      spendableBalance: BigNumber("1000000000000000000000"),
      multiversxResources: {
        delegations: [
          {
            contract: "contract:a",
          } as MultiversxDelegation,
        ],
      },
    };
    const multiversxPreloadData = {
      validators: [
        {
          contract: "contract:a",
          aprValue: 0.2,
        } as MultiversxProvider,
        {
          contract: MULTIVERSX_LEDGER_VALIDATOR_ADDRESS,
          aprValue: 0.1,
        } as MultiversxProvider,
        {
          contract: "contract:b",
          aprValue: 0.3,
        } as MultiversxProvider,
      ],
    };
    const result = getAccountBannerState(
      account as unknown as MultiversxAccount,
      multiversxPreloadData,
    );
    expect(result).toEqual({
      bannerType: "delegate",
    });
  });

  it("returns no banner when ledger is the worst validator and the account balance is zero", () => {
    const account = {
      spendableBalance: BigNumber(0),
      multiversxResources: {
        delegations: [
          {
            contract: "contract:a",
          } as MultiversxDelegation,
        ],
      },
    };
    const multiversxPreloadData = {
      validators: [
        {
          contract: "contract:a",
          aprValue: 0.2,
        } as MultiversxProvider,
        {
          contract: MULTIVERSX_LEDGER_VALIDATOR_ADDRESS,
          aprValue: 0.1,
        } as MultiversxProvider,
        {
          contract: "contract:b",
          aprValue: 0.3,
        } as MultiversxProvider,
      ],
    };
    const result = getAccountBannerState(
      account as unknown as MultiversxAccount,
      multiversxPreloadData,
    );
    expect(result).toEqual({
      bannerType: "hidden",
    });
  });
});
