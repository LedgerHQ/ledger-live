import { WriteSetChange, Event } from "@aptos-labs/ts-sdk";
import { APTOS_ASSET_ID, APTOS_COIN_CHANGE, APTOS_FUNGIBLE_STORE } from "../../constants";
import { getEventCoinAddress, getEventFAAddress } from "../../logic/getCoinAndAmounts";
import { getResourceAddress } from "../../logic/getResourceAddress";
import { AptosTransaction } from "../../types";

describe("getResourceAddress", () => {
  it("should return coin name from the change", () => {
    const change = {
      type: "write_resource",
      data: {
        type: APTOS_COIN_CHANGE,
        data: {
          withdraw_events: {
            guid: {
              id: {
                addr: "0x11",
                creation_num: "2",
              },
            },
          },
        },
      },
    } as unknown as WriteSetChange;

    const tx: AptosTransaction = {
      hash: "0x123",
      block: { hash: "0xabc", height: 1 },
      timestamp: "1000000",
      sequence_number: "1",
      version: "1",
      changes: [change],
    } as unknown as AptosTransaction;

    const event = {
      guid: {
        account_address: "0x11",
        creation_number: "2",
      },
      type: "0x1::coin::WithdrawEvent",
    } as Event;

    const result = getResourceAddress(tx, event, "withdraw_events", getEventCoinAddress);
    expect(result).toEqual(APTOS_ASSET_ID);
  });

  it("should return null for not finding the valid coin in change", () => {
    const change = {
      type: "write_resource",
      data: {
        type: APTOS_COIN_CHANGE,
        data: {
          withdraw_events: {
            guid: {
              id: {
                addr: "0x12",
                creation_num: "2",
              },
            },
          },
        },
      },
    } as unknown as WriteSetChange;

    const tx: AptosTransaction = {
      hash: "0x123",
      block: { hash: "0xabc", height: 1 },
      timestamp: "1000000",
      sequence_number: "1",
      version: "1",
      changes: [change],
    } as unknown as AptosTransaction;

    const event = {
      guid: {
        account_address: "0x11",
        creation_number: "1",
      },
      type: "0x1::coin::WithdrawEvent",
    } as Event;

    const result = getResourceAddress(tx, event, "withdraw_events", getEventCoinAddress);
    expect(result).toBe(null);
  });

  it("should return null for not finding the event name in change", () => {
    const change = {
      type: "write_resource",
      data: {
        type: APTOS_COIN_CHANGE,
        data: {
          other_events: {
            guid: {
              id: {
                addr: "0x12",
                creation_num: "2",
              },
            },
          },
        },
      },
    } as unknown as WriteSetChange;

    const tx: AptosTransaction = {
      hash: "0x123",
      block: { hash: "0xabc", height: 1 },
      timestamp: "1000000",
      sequence_number: "1",
      version: "1",
      changes: [change],
    } as unknown as AptosTransaction;

    const event = {
      guid: {
        account_address: "0x11",
        creation_number: "1",
      },
      type: "0x1::coin::WithdrawEvent",
    } as Event;

    const result = getResourceAddress(tx, event, "withdraw_events", getEventCoinAddress);
    expect(result).toBe(null);
  });

  it("should return fungible asset address", () => {
    const change = {
      type: "write_resource",
      address: "0xsomeaddress",
      data: {
        type: APTOS_FUNGIBLE_STORE,
        data: {
          metadata: {
            inner: "0xassetaddress",
          },
        },
      },
    } as unknown as WriteSetChange;

    const tx: AptosTransaction = {
      hash: "0x123",
      block: { hash: "0xabc", height: 1 },
      timestamp: "1000000",
      sequence_number: "1",
      version: "1",
      changes: [change],
    } as unknown as AptosTransaction;

    const event = {
      guid: {
        account_address: "0x0",
        creation_number: "0",
      },
      type: "0x1::fungible_asset::Deposit",
      data: {
        amount: "100",
        store: "0xsomeaddress",
      },
    } as Event;

    const result = getResourceAddress(tx, event, "withdraw_events", getEventFAAddress);
    expect(result).toEqual("0xassetaddress");
  });

  it("should return null address instead of fungible asset when wrong type", () => {
    const change = {
      type: "write_resource",
      address: "0xsomeaddress",
      data: {
        type: APTOS_COIN_CHANGE,
        data: {
          metadata: {
            inner: "0xassetaddress",
          },
        },
      },
    } as unknown as WriteSetChange;

    const tx: AptosTransaction = {
      hash: "0x123",
      block: { hash: "0xabc", height: 1 },
      timestamp: "1000000",
      sequence_number: "1",
      version: "1",
      changes: [change],
    } as unknown as AptosTransaction;

    const event = {
      guid: {
        account_address: "0x0",
        creation_number: "0",
      },
      type: "0x1::fungible_asset::Deposit",
      data: {
        amount: "100",
        store: "0xsomeaddress",
      },
    } as Event;

    const result = getResourceAddress(tx, event, "withdraw_events", getEventFAAddress);
    expect(result).toEqual(null);
  });

  it("should return null address instead of fungible asset when wrong event address", () => {
    const change = {
      type: "write_resource",
      address: "0xsomeaddress",
      data: {
        type: APTOS_FUNGIBLE_STORE,
        data: {
          metadata: {
            inner: "0xassetaddress",
          },
        },
      },
    } as unknown as WriteSetChange;

    const tx: AptosTransaction = {
      hash: "0x123",
      block: { hash: "0xabc", height: 1 },
      timestamp: "1000000",
      sequence_number: "1",
      version: "1",
      changes: [change],
    } as unknown as AptosTransaction;

    const event = {
      guid: {
        account_address: "0x0",
        creation_number: "0",
      },
      type: "0x1::fungible_asset::Deposit",
      data: {
        amount: "100",
        store: "0xwrongaddress",
      },
    } as Event;

    const result = getResourceAddress(tx, event, "withdraw_events", getEventFAAddress);
    expect(result).toEqual(null);
  });
});
