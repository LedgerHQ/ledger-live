export const messageNotInCAL = {
  domain: {
    name: "Message Not In CAL",
  },
  types: {
    EIP712Domain: [
      {
        name: "name",
        type: "string",
      },
    ],
    hello: [{ name: "foo", type: "string" }],
  },
  primaryType: "hello",
  message: {
    hello: {
      foo: "bar",
    },
  },
};

export const messageNotInCALSchemaHash = "98d7ea16f310e5105efa5c01c63649c7fb786a7d5b8494e0ac52ad35";

export const dynamicCAL = {
  [`0:0x0000000000000000000000000000000000000000:${messageNotInCALSchemaHash}`]: "found",
};
