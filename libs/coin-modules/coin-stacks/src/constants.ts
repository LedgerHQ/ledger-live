export const STACKS_DUMMY_ADDRESS = "SP3KS7VMY2ZNE6SB88PHR4SKRK2EEPHS8N8MCCBR9";
export const STACKS_DUMMY_PUBLIC_KEY =
  "022a460decc9dba8c452927fecb33d7ae25a8d79dc5442b84feaf8f3aa0e2b575d";

/** Cap for the Stacks indexer's paginated endpoints (transactions, token balances). */
export const MAX_STACKS_PAGE_LIMIT = 50;

/** The widely-used community `send-many-memo` contract for batched STX transfers with memos.
 * Its tuple argument shape (`{ memo?, to, ustx }`) is contract-specific -- an unrelated contract
 * can expose its own, differently-shaped `send-many` function (seen live on mainnet from a
 * token-launch contract using `{ amount, memo, to }`), so matching on function name alone is not
 * enough to assume this shape. */
export const SEND_MANY_MEMO_CONTRACT_ID =
  "SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.send-many-memo";
