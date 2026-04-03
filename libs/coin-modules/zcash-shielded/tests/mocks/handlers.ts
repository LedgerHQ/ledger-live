import { http, HttpResponse } from "msw";
import {
  FIRST_BLOCK_COUNT,
  LAST_BLOCK_COUNT,
  testAccount1,
  blocks,
  dummyBlockMock,
} from "./blockchainDataMock";
import { ZCASH_JSON_RPC_SERVER_TESTNET } from "../../src/constants";

const ERROR_CODE = -5;

let lastBlockCount = LAST_BLOCK_COUNT;
export const setLastBlockCount = (blockNumber: number) => {
  lastBlockCount = blockNumber;
};
export const resetLastBlockCount = () => {
  lastBlockCount = LAST_BLOCK_COUNT;
};

export const handlers = [
  http.post(`${ZCASH_JSON_RPC_SERVER_TESTNET}`, async ({ request }) => {
    const body = await request.clone().json();

    switch (body.method) {
      case "getblockcount": {
        return HttpResponse.json({
          result: lastBlockCount,
        });
      }

      case "getblock": {
        const blockheightOrHash = body.params[0];
        for (const block of blocks) {
          if (blockheightOrHash === block.hash || blockheightOrHash === block.height.toString()) {
            return HttpResponse.json({
              result: {
                ...block,
              },
            });
          }
        }

        if (blockheightOrHash >= FIRST_BLOCK_COUNT && blockheightOrHash <= LAST_BLOCK_COUNT + 5) {
          return HttpResponse.json({
            result: dummyBlockMock(blockheightOrHash),
          });
        }

        return HttpResponse.json({
          error: {
            code: ERROR_CODE,
            message: "block height not in best chain",
          },
        });
      }

      case "getrawtransaction": {
        const txId = body.params[0];
        for (const transaction of [...testAccount1.transactions]) {
          if (txId === transaction.tx.txid) {
            return HttpResponse.json({
              result: {
                ...transaction.tx,
              },
            });
          }
        }

        return HttpResponse.json({
          error: {
            code: ERROR_CODE,
            message: "No such mempool or main chain transaction",
          },
        });
      }

      default: {
        break;
      }
    }

    return HttpResponse.json({
      error: {
        code: ERROR_CODE,
        message: "Method not found",
      },
    });
  }),
];
