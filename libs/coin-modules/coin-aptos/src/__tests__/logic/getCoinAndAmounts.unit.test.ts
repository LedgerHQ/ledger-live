import BigNumber from "bignumber.js";
import { AptosTransaction } from "../../types";
import { getCoinAndAmounts } from "../../logic/getCoinAndAmounts";
import {
  APTOS_ASSET_ID,
  APTOS_COIN_CHANGE,
  APTOS_FUNGIBLE_STORE,
  APTOS_OBJECT_CORE,
} from "../../constants";

describe("getCoinAndAmounts", () => {
  it("should calculate the correct legacy coins amounts for withdraw and deposit events", () => {
    const tx = {
      events: [
        {
          type: "0x1::coin::WithdrawEvent",
          guid: {
            account_address: "0x11",
            creation_number: "1",
          },
          data: {
            amount: "100",
          },
        },
        {
          type: "0x1::coin::DepositEvent",
          guid: {
            account_address: "0x11",
            creation_number: "2",
          },
          data: {
            amount: "50",
          },
        },
      ],
      changes: [
        {
          type: "write_resource",
          data: {
            type: APTOS_COIN_CHANGE,
            data: {
              withdraw_events: {
                guid: {
                  id: {
                    addr: "0x11",
                    creation_num: "1",
                  },
                },
              },
              deposit_events: {
                guid: {
                  id: {
                    addr: "0x11",
                    creation_num: "2",
                  },
                },
              },
            },
          },
        },
      ],
    } as unknown as AptosTransaction;

    const address = "0x11";
    const result = getCoinAndAmounts(tx, address);

    expect(result.amount_in).toEqual(new BigNumber(50));
    expect(result.amount_out).toEqual(new BigNumber(100));
    expect(result.coin_id).toEqual(APTOS_ASSET_ID);
  });

  it("should calculate the correct fungible asset amounts for withdraw and deposit events", () => {
    const tx = {
      events: [
        {
          type: "0x1::fungible_asset::Withdraw",
          guid: {
            account_address: "0x11",
            creation_number: "1",
          },
          data: {
            amount: "100",
            store: "0x22",
          },
        },
        {
          type: "0x1::fungible_asset::Deposit",
          guid: {
            account_address: "0x11",
            creation_number: "2",
          },
          data: {
            amount: "50",
            store: "0x33",
          },
        },
      ],
      changes: [
        {
          type: "write_resource",
          address: "0x22",
          data: {
            type: APTOS_FUNGIBLE_STORE,
            data: {
              metadata: {
                inner: "0x44",
              },
              transfer_events: {
                guid: {
                  id: {
                    addr: "0x11",
                    creation_num: "2",
                  },
                },
              },
            },
          },
        },
        {
          type: "write_resource",
          address: "0x22",
          data: {
            type: APTOS_OBJECT_CORE,
            data: {
              owner: "0x11",
              transfer_events: {
                guid: {
                  id: {
                    addr: "0x22",
                    creation_num: "2",
                  },
                },
              },
            },
          },
        },
        {
          type: "write_resource",
          data: {
            type: APTOS_COIN_CHANGE,
            data: {
              withdraw_events: {
                guid: {
                  id: {
                    addr: "0x11",
                    creation_num: "1",
                  },
                },
              },
              deposit_events: {
                guid: {
                  id: {
                    addr: "0x11",
                    creation_num: "2",
                  },
                },
              },
            },
          },
        },
      ],
    } as unknown as AptosTransaction;

    const address = "0x11";
    const result = getCoinAndAmounts(tx, address);

    expect(result.amount_in).toEqual(new BigNumber(0));
    expect(result.amount_out).toEqual(new BigNumber(100));
    expect(result.coin_id).toEqual("0x44");
  });

  it("should handle transactions with other events", () => {
    const tx = {
      events: [
        {
          type: "0x1::coin::OtherEvent",
          guid: {
            account_address: "0x11",
            creation_number: "1",
          },
          data: {
            amount: "100",
          },
        },
      ],
    } as unknown as AptosTransaction;

    const address = "0x1";
    const result = getCoinAndAmounts(tx, address);

    expect(result.amount_in).toEqual(new BigNumber(0));
    expect(result.amount_out).toEqual(new BigNumber(0));
    expect(result.coin_id).toEqual(null);
  });
});
