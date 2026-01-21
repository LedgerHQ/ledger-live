import { http, HttpResponse } from "msw";
import { blocks, transactions } from "../tests/testAccounts";

const JSON_RPC_SERVER = "http://localhost:18232";

export const handlers = [
  http.post(`${JSON_RPC_SERVER}`, async ({ request }) => {
    const body = await request.clone().json();

    switch (body.method) {
      case "getblock":
        for (const block of blocks) {
          if (body.params[0] === block.hash) {
            return HttpResponse.json({
              result: {
                ...block,
              },
            });
          }
        }

        return HttpResponse.json({
          error: {
            code: -5,
            message: "block height not in best chain",
          },
        });

      case "getrawtransaction":
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
            code: -5,
            message: "No such mempool or main chain transaction",
          },
        });

      default:
        break;
    }

    return HttpResponse.json({
      error: {
        code: -5,
        message: "Method not found",
      },
    });
  }),
];
