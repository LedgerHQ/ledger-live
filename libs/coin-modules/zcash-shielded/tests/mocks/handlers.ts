import { http, HttpResponse } from "msw";
import { blocks, LAST_BLOCK_COUNT, transactions } from "../../tests/testAccounts";
import { JSON_RPC_SERVER } from "../../src/constants";

const ERROR_CODE = -5;

let lastBlockCount = LAST_BLOCK_COUNT;
export const setLastBlockCount = (blockNumber: number) => {
  lastBlockCount = blockNumber;
};
export const resetLastBlockCount = () => {
  lastBlockCount = LAST_BLOCK_COUNT;
};

export const handlers = [
  http.post(`${JSON_RPC_SERVER}`, async ({ request }) => {
    const body = await request.clone().json();

    switch (body.method) {
      case "getblockcount": {
        return HttpResponse.json({
          result: lastBlockCount,
        });
      }

      case "getblock": {
        for (const block of blocks) {
          if (body.params[0] === block.hash || body.params[0] === block.height.toString()) {
            return HttpResponse.json({
              result: {
                ...block,
              },
            });
          }
        }

        return HttpResponse.json({
          error: {
            code: ERROR_CODE,
            message: "block height not in best chain",
          },
        });
      }

      case "getrawtransaction": {
        for (const transaction of transactions) {
          if (body.params[0] === transaction.txid) {
            return HttpResponse.json({
              result: {
                ...transaction,
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
