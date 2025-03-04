export const uiConfig = {
  delegate: {
    description: "Delegate your coins to a validator",
    inputs: [
      {
        name: "amount",
        type: "number",
        validators: ["required"],
      },
      {
        name: "validator",
        type: "select",
        options: ["validatorAddress1", "validatorAddress2"],
        defaultValue: "validatorAddress1",
        validators: ["required"],
      },
    ],
  },
  send: {
    description: "Send coins to another address",
    inputs: [
      {
        name: "recipient",
        type: "text",
        validators: ["required"],
      },
      {
        name: "amount",
        type: "number",
        validators: ["required"],
      },
      {
        name: "memo",
        type: "text",
        validators: [],
      },
    ],
  },
};
