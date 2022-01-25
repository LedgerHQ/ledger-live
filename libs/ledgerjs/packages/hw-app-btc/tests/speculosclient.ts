import axios from "axios";

const SPECULOS_REST_API_ENDPOINT = "http://127.0.0.1:5000";

export async function approveTransaction(): Promise<void> {
  await axios.post(
    `${SPECULOS_REST_API_ENDPOINT}/automation`,
    approveTransactionScript
  );
}

/* eslint-disable */
const approveTransactionScript = {
  "version": 1,
  "rules": [
    {
      "text": "output #1",
      "actions": [
        ["button", 2, true], ["button", 2, false],
        ["button", 2, true], ["button", 2, false],
        ["button", 2, true], ["button", 2, false],
        ["button", 2, true], ["button", 2, false],
        ["button", 2, true], ["button", 2, false],
        ["button", 2, true], ["button", 2, false],
        ["button", 2, true], ["button", 2, false],
        ["button", 1, true], ["button", 1, false],
        ["button", 1, true], ["button", 2, true],
        ["button", 1, false], ["button", 2, false],        
      ]
    },
    {
      "text": "transaction",
      "actions": [
        ["button", 2, true], ["button", 2, false],
        ["button", 2, true], ["button", 2, false],
      ]
    },
    {
      "text": "and send",
      "actions": [
        ["button", 1, true], ["button", 2, true],
        ["button", 1, false], ["button", 2, false],
      ]
    }
  ]
}
/* eslint-enable */
