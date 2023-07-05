export const messageNotInCAL = {
  domain: {
    name: "Message Not In CAL",
    version: "1",
    chainId: 1,
    verifyingContract: "0xd007d007A0D06D4fbbF627410eADE051FD66FC59",
    salt: "0x446f6f7420446f6f74206c657320746f6361726473206475205661756c74",
  },
  types: {
    EIP712Domain: [
      { name: "name", type: "string" },
      { name: "version", type: "string" },
      { name: "chainId", type: "uint256" },
      { name: "verifyingContract", type: "address" },
      { name: "salt", type: "bytes32" },
    ],
    hello: [{ name: "foo", type: "string" }],
  },
  primaryType: "hello",
  message: {
    foo: "bar",
  },
};

export const messageNotInCALSchemaHash = "7f5ab7ce66fbfb21beb6189a02b44bb141b5fb2008e3d0c1e83351e7";

export const dynamicCAL = {
  [`1:0xd007d007A0D06D4fbbF627410eADE051FD66FC59:${messageNotInCALSchemaHash}`]: "found",
};
