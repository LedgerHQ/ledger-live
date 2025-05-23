import { ABIFunction } from "@vechain/sdk-core";

const get: ABIFunction = new ABIFunction({
  constant: true,
  inputs: [
    {
      name: "_key",
      type: "bytes32",
    },
  ],
  name: "get",
  outputs: [
    {
      name: "",
      type: "uint256",
    },
  ],
  payable: false,
  stateMutability: "view",
  type: "function",
});

type ParamsType = {
  get: ABIFunction;
};

export const params: ParamsType = { get };
