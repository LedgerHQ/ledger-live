import { getAccountBannerState } from "./banner";
import { ElrondAccount, ElrondDelegation, ElrondProvider } from "./types";
import { BigNumber } from "bignumber.js";
import { ELROND_LEDGER_VALIDATOR_ADDRESS } from "./constants";

describe("getAccountBannerState", () => {
  it("returns the delegate banner when balance is not zero and there are no delegations", () => {
    const account = {
      spendableBalance: BigNumber(1000000000000000000000),
      elrondResources: {
        delegations: [],
      },
    };
    const elrondPreloadData = {
      validators: [
        {
          contract: ELROND_LEDGER_VALIDATOR_ADDRESS,
          aprValue: 0.2,
        } as ElrondProvider,
      ],
    };
    const result = getAccountBannerState(
      account as unknown as ElrondAccount,
      elrondPreloadData
    );
    expect(result).toEqual({
      bannerType: "delegate",
    });
  });

  it("returns no banner when balance is zero and account already has delegations", () => {
    const account = {
      spendableBalance: BigNumber(0),
      elrondResources: {
        delegations: [
          {
            validatorAddress: "validatorAddress",
          },
        ],
      },
    };
    const elrondPreloadData = {
      validators: [
        {
          contract: ELROND_LEDGER_VALIDATOR_ADDRESS,
          aprValue: 0.2,
        } as ElrondProvider,
      ],
    };
    const result = getAccountBannerState(
      account as unknown as ElrondAccount,
      elrondPreloadData
    );
    expect(result).toEqual({
      bannerType: "hidden",
    });
  });

  it("returns no banner when there is no ledger validator", () => {
    const account = {
      spendableBalance: BigNumber(100),
      elrondResources: {
        delegations: [
          {
            contract: "contract:a",
          } as ElrondDelegation,
        ],
      },
    };
    const elrondPreloadData = {
      validators: [
        {
          contract: "123",
        } as ElrondProvider,
      ],
    };
    const result = getAccountBannerState(
      account as unknown as ElrondAccount,
      elrondPreloadData
    );
    expect(result).toEqual({
      bannerType: "hidden",
    });
  });

  it("returns the redelegation banner when the ledger validator is not the worst validator", () => {
    const account = {
      spendableBalance: BigNumber(100),
      elrondResources: {
        delegations: [
          {
            contract: "contract:a",
          } as ElrondDelegation,
        ],
      },
    };
    const elrondPreloadData = {
      validators: [
        {
          contract: "contract:a",
          aprValue: 0.1,
        } as ElrondProvider,
        {
          contract: ELROND_LEDGER_VALIDATOR_ADDRESS,
          aprValue: 0.2,
        } as ElrondProvider,
        {
          contract: "contract:b",
          aprValue: 0.3,
        } as ElrondProvider,
      ],
    };
    const result = getAccountBannerState(
      account as unknown as ElrondAccount,
      elrondPreloadData
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
      spendableBalance: BigNumber(1000000000000000000000),
      elrondResources: {
        delegations: [
          {
            contract: "contract:a",
          } as ElrondDelegation,
        ],
      },
    };
    const elrondPreloadData = {
      validators: [
        {
          contract: "contract:a",
          aprValue: 0.2,
        } as ElrondProvider,
        {
          contract: ELROND_LEDGER_VALIDATOR_ADDRESS,
          aprValue: 0.1,
        } as ElrondProvider,
        {
          contract: "contract:b",
          aprValue: 0.3,
        } as ElrondProvider,
      ],
    };
    const result = getAccountBannerState(
      account as unknown as ElrondAccount,
      elrondPreloadData
    );
    expect(result).toEqual({
      bannerType: "delegate",
    });
  });

  it("returns no banner when ledger is the worst validator and the account balance is zero", () => {
    const account = {
      spendableBalance: BigNumber(0),
      elrondResources: {
        delegations: [
          {
            contract: "contract:a",
          } as ElrondDelegation,
        ],
      },
    };
    const elrondPreloadData = {
      validators: [
        {
          contract: "contract:a",
          aprValue: 0.2,
        } as ElrondProvider,
        {
          contract: ELROND_LEDGER_VALIDATOR_ADDRESS,
          aprValue: 0.1,
        } as ElrondProvider,
        {
          contract: "contract:b",
          aprValue: 0.3,
        } as ElrondProvider,
      ],
    };
    const result = getAccountBannerState(
      account as unknown as ElrondAccount,
      elrondPreloadData
    );
    expect(result).toEqual({
      bannerType: "hidden",
    });
  });
});
