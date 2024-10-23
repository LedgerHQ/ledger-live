import { abi } from "thor-devkit";

/**
 * FUNCTIONS
 */
const set: abi.Function.Definition = {
  constant: false,
  inputs: [
    {
      name: "_key",
      type: "bytes32",
    },
    {
      name: "_value",
      type: "uint256",
    },
  ],
  name: "set",
  outputs: [],
  payable: false,
  stateMutability: "nonpayable",
  type: "function",
};

const get: abi.Function.Definition = {
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
};

/**
 * EVENTS
 */
const Set: abi.Event.Definition = {
  anonymous: false,
  inputs: [
    {
      indexed: true,
      name: "key",
      type: "bytes32",
    },
    {
      indexed: false,
      name: "value",
      type: "uint256",
    },
  ],
  name: "Set",
  type: "event",
};

export default {
  set: new abi.Function(set),
  get: new abi.Function(get),
  Set: new abi.Event(Set),
};
