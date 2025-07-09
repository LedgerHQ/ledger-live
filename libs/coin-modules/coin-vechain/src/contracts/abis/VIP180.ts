import { ABIEvent, ABIFunction } from "@vechain/sdk-core";

const TransferEvent: ABIEvent = new ABIEvent({
  anonymous: false,
  inputs: [
    {
      indexed: true,
      internalType: "address",
      name: "from",
      type: "address",
    },
    {
      indexed: true,
      internalType: "address",
      name: "to",
      type: "address",
    },
    {
      indexed: false,
      internalType: "uint256",
      name: "value",
      type: "uint256",
    },
  ],
  name: "Transfer",
  type: "event",
});

const transfer: ABIFunction = new ABIFunction({
  inputs: [
    {
      internalType: "address",
      name: "to",
      type: "address",
    },
    {
      internalType: "uint256",
      name: "amount",
      type: "uint256",
    },
  ],
  name: "transfer",
  outputs: [
    {
      internalType: "bool",
      name: "",
      type: "bool",
    },
  ],
  stateMutability: "nonpayable",
  type: "function",
});

type VIP180Type = {
  TransferEvent: ABIEvent;
  transfer: ABIFunction;
};

export const VIP180: VIP180Type = {
  TransferEvent,
  transfer,
};
