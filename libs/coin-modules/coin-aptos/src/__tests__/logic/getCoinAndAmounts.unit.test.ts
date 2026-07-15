import BigNumber from "bignumber.js";
import {
  APTOS_ASSET_ID,
  APTOS_COIN_CHANGE,
  APTOS_FUNGIBLE_STORE,
  APTOS_OBJECT_CORE,
  OP_TYPE,
} from "../../constants";
import { getCoinAndAmounts } from "../../logic/getCoinAndAmounts";
import { AptosTransaction } from "../../types";

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
          address: "0x11",
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
          address: "0x11",
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

  it("should send funds via fungible transfer payload", () => {
    const userAddress = "0xsender";
    const tx = {
      events: [
        {
          type: "0x1::fungible_asset::Withdraw",
          guid: {
            account_address: "0x99",
            creation_number: "1",
          },
          data: {
            amount: "200",
            store: "0xstore",
          },
        },
      ],
      changes: [
        {
          type: "write_resource",
          address: "0xstore",
          data: {
            type: APTOS_FUNGIBLE_STORE,
            data: {
              metadata: { inner: "0xfaCoin" },
              transfer_events: {},
            },
          },
        },
      ],
      payload: {
        function: "0x1::primary_fungible_store::transfer",
        arguments: ["0xrecipient", "200"],
      },
    } as unknown as AptosTransaction;

    const result = getCoinAndAmounts(tx, userAddress);

    expect(result.amount_out).toEqual(new BigNumber(200));
    expect(result.amount_in).toEqual(new BigNumber(0));
    expect(result.coin_id).toEqual("0xfaCoin");
  });

  it("should receive funds via aptos account transfer payload", () => {
    const userAddress = "0xrecipient";
    const tx = {
      events: [
        {
          type: "0x1::fungible_asset::Deposit",
          guid: {
            account_address: "0x99",
            creation_number: "2",
          },
          data: {
            amount: "75",
            store: "0xstore2",
          },
        },
      ],
      changes: [
        {
          type: "write_resource",
          address: "0xstore2",
          data: {
            type: APTOS_FUNGIBLE_STORE,
            data: {
              metadata: { inner: "0xfaCoin2" },
              transfer_events: {},
            },
          },
        },
      ],
      payload: {
        function: "0x1::aptos_account::transfer",
        arguments: ["0xrecipient", "75"],
      },
    } as unknown as AptosTransaction;

    const result = getCoinAndAmounts(tx, userAddress);

    expect(result.amount_in).toEqual(new BigNumber(75));
    expect(result.amount_out).toEqual(new BigNumber(0));
    expect(result.coin_id).toEqual("0xfaCoin2");
  });

  describe("payload fallback for transactions without transfer events", () => {
    const userAddress = "0x07b6d86d89c21e18c8380f1e4c0ec4bb78cc0fbc24ae9abf73efa943ef9e414b";
    const userNoLeadingZero = "0x7b6d86d89c21e18c8380f1e4c0ec4bb78cc0fbc24ae9abf73efa943ef9e414b";

    const feeStatement = {
      type: "0x1::transaction_fee::FeeStatement",
      guid: { account_address: "0x0", creation_number: "0" },
      data: { total_charge_gas_units: "11" },
    };

    it("recovers an outgoing native transfer_coins that only emits a FeeStatement", () => {
      const tx = {
        sender: userNoLeadingZero,
        gas_used: "11",
        gas_unit_price: "100",
        events: [feeStatement],
        changes: [],
        payload: {
          function: "0x1::aptos_account::transfer_coins",
          type_arguments: ["0x1::aptos_coin::AptosCoin"],
          arguments: [
            "0x44de94d58af29e6405209b378560e43ff8a2a4a20ca6d63b35788b6ce285d264",
            "22107713771",
          ],
        },
      } as unknown as AptosTransaction;

      const result = getCoinAndAmounts(tx, userAddress);

      expect(result.coin_id).toEqual(APTOS_ASSET_ID);
      expect(result.amount_out).toEqual(new BigNumber("22107713771"));
      expect(result.amount_in).toEqual(new BigNumber(0));
    });

    it("recovers an incoming native transfer_coins without events", () => {
      const tx = {
        sender: "0x84b1675891d370d5de8f169031f9c3116d7add256ecf50a4bc71e3135ddba6e0",
        gas_used: "11",
        gas_unit_price: "100",
        events: [],
        changes: [],
        payload: {
          function: "0x1::aptos_account::transfer_coins",
          type_arguments: ["0x1::aptos_coin::AptosCoin"],
          arguments: [userNoLeadingZero, "28000000"],
        },
      } as unknown as AptosTransaction;

      const result = getCoinAndAmounts(tx, userAddress);

      expect(result.coin_id).toEqual(APTOS_ASSET_ID);
      expect(result.amount_in).toEqual(new BigNumber("28000000"));
      expect(result.amount_out).toEqual(new BigNumber(0));
    });

    it("recovers a delegation add_stake that only emits a FeeStatement", () => {
      const tx = {
        sender: userNoLeadingZero,
        gas_used: "11",
        gas_unit_price: "100",
        events: [feeStatement],
        changes: [],
        payload: {
          function: "0x1::delegation_pool::add_stake",
          type_arguments: [],
          arguments: ["0xpool", "17100000000"],
        },
      } as unknown as AptosTransaction;

      const result = getCoinAndAmounts(tx, userAddress);

      expect(result.type).toEqual(OP_TYPE.STAKE);
      expect(result.coin_id).toEqual(APTOS_ASSET_ID);
      expect(result.amount_out).toEqual(new BigNumber("17100000000"));
      expect(result.amount_in).toEqual(new BigNumber(0));
    });

    it("recovers a delegation unlock as an UNSTAKE", () => {
      const tx = {
        sender: userNoLeadingZero,
        gas_used: "11",
        gas_unit_price: "100",
        events: [feeStatement],
        changes: [],
        payload: {
          function: "0x1::delegation_pool::unlock",
          type_arguments: [],
          arguments: ["0xpool", "5000000000"],
        },
      } as unknown as AptosTransaction;

      const result = getCoinAndAmounts(tx, userAddress);

      expect(result.type).toEqual(OP_TYPE.UNSTAKE);
      expect(result.amount_in).toEqual(new BigNumber("5000000000"));
      expect(result.amount_out).toEqual(new BigNumber(0));
    });

    it("does NOT recover a scam token impersonating AptosCoin under another address", () => {
      const tx = {
        sender: "0xf6b9e9d177d02dc71825ecf337e0d7c64eb9df0a35a95dc7beaaf4f7e4741c61",
        gas_used: "11",
        gas_unit_price: "100",
        events: [],
        changes: [],
        payload: {
          function: "0x1::aptos_account::transfer_coins",
          type_arguments: [
            "0x50788befc1107c0cc4473848a92e5c783c635866ce3c98de71d2eeb7d2a34f85::aptos_coin::AptosCoin",
          ],
          arguments: [userNoLeadingZero, "574299979"],
        },
      } as unknown as AptosTransaction;

      const result = getCoinAndAmounts(tx, userAddress);

      expect(result.coin_id).toBeNull();
      expect(result.amount_in).toEqual(new BigNumber(0));
    });

    it("surfaces the gas fee for a transaction that only spent gas (no transfer)", () => {
      const tx = {
        sender: userNoLeadingZero,
        gas_used: "11",
        gas_unit_price: "100",
        events: [feeStatement],
        changes: [],
        payload: { function: "0x1::some_contract::call", type_arguments: [], arguments: [] },
      } as unknown as AptosTransaction;

      const result = getCoinAndAmounts(tx, userAddress);

      expect(result.coin_id).toEqual(APTOS_ASSET_ID);
      expect(result.amount_out).toEqual(new BigNumber(1100));
      expect(result.amount_in).toEqual(new BigNumber(0));
    });
  });

  it("attributes an FA deposit whose store owner is returned without its leading zero", () => {
    const userAddress = "0x07b6d86d89c21e18c8380f1e4c0ec4bb78cc0fbc24ae9abf73efa943ef9e414b";
    const store = "0x2bf67be5edd1e9c391e21098b3185236b65e9a41bcd3d37476bd6e2b9f59bad3";
    const tx = {
      sender: "0x84b1675891d370d5de8f169031f9c3116d7add256ecf50a4bc71e3135ddba6e0",
      events: [
        {
          type: "0x1::fungible_asset::Deposit",
          guid: { account_address: "0x0", creation_number: "0" },
          data: { amount: "28000000", store },
        },
      ],
      changes: [
        {
          type: "write_resource",
          address: store,
          data: {
            type: APTOS_OBJECT_CORE,
            data: { owner: "0x7b6d86d89c21e18c8380f1e4c0ec4bb78cc0fbc24ae9abf73efa943ef9e414b" },
          },
        },
        {
          type: "write_resource",
          address: store,
          data: {
            type: APTOS_FUNGIBLE_STORE,
            data: { metadata: { inner: "0xa" }, transfer_events: {} },
          },
        },
      ],
      payload: { function: "0x1::some_contract::call", type_arguments: [], arguments: [] },
    } as unknown as AptosTransaction;

    const result = getCoinAndAmounts(tx, userAddress);

    expect(result.coin_id).toEqual("0xa");
    expect(result.amount_in).toEqual(new BigNumber("28000000"));
  });
});
