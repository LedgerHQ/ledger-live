import { getAccountBannerState } from "./banner";
import { ElrondAccount, ElrondDelegation, ElrondProvider } from "./types";
import { BigNumber } from "bignumber.js";
import { ELROND_LEDGER_VALIDATOR_ADDRESS } from "./constants";

describe("getAccountBannerState", () => {
  it("returns the delegate banner when balance is not zero and there are no delegations", () => {
    const account = {
      balance: BigNumber(1),
      elrondResources: {
        delegations: [],
      },
    };
    const elrondPreloadData = {
      validators: [],
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
      balance: BigNumber(0),
      elrondResources: {
        delegations: [
          {
            validatorAddress: "validatorAddress",
          },
        ],
      },
    };
    const elrondPreloadData = {
      validators: [],
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
      balance: BigNumber(100),
      elrondResources: {
        delegations: [
          {
            address: "address:a",
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
      balance: BigNumber(100),
      elrondResources: {
        delegations: [
          {
            contract: "address:a",
            address: "address:a",
          } as ElrondDelegation,
        ],
      },
    };
    const elrondPreloadData = {
      validators: [
        {
          contract: "address:a",
          aprValue: 0.1,
        } as ElrondProvider,
        {
          contract: ELROND_LEDGER_VALIDATOR_ADDRESS,
          aprValue: 0.2,
        } as ElrondProvider,
        {
          contract: "address:b",
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
      mappedDelegations: [
        {
          address: "address:a",
          contract: "address:a",
          validator: {
            aprValue: 0.1,
            contract: "address:a",
          },
        },
      ],
      selectedDelegation: {
        address: "address:a",
        contract: "address:a",
      },
    });
  });

  it("returns the delegation banner when ledger is the worst validator and the account balance is not zero", () => {
    const account = {
      balance: BigNumber(100),
      elrondResources: {
        delegations: [
          {
            address: "address:a",
          } as ElrondDelegation,
        ],
      },
    };
    const elrondPreloadData = {
      validators: [
        {
          contract: "address:a",
          aprValue: 0.2,
        } as ElrondProvider,
        {
          contract: ELROND_LEDGER_VALIDATOR_ADDRESS,
          aprValue: 0.1,
        } as ElrondProvider,
        {
          contract: "address:b",
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
      balance: BigNumber(0),
      elrondResources: {
        delegations: [
          {
            address: "address:a",
          } as ElrondDelegation,
        ],
      },
    };
    const elrondPreloadData = {
      validators: [
        {
          contract: "address:a",
          aprValue: 0.2,
        } as ElrondProvider,
        {
          contract: ELROND_LEDGER_VALIDATOR_ADDRESS,
          aprValue: 0.1,
        } as ElrondProvider,
        {
          contract: "address:b",
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
