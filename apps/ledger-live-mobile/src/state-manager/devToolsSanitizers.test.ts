import { CARD_REDUCER_PATH, earnApi } from "@shared/api-services";
import { devToolsSanitizers } from "./devToolsSanitizers";

const WALLET_ADDRESS = "sentinel-wallet-address";
const STAKE_ACCOUNT = "sentinel-stake-account";
const ACCESS_TOKEN = "sentinel-access-token";

const { actionSanitizer, stateSanitizer } = devToolsSanitizers;

describe("devToolsSanitizers", () => {
  it("should drop the wallet address and the stake accounts of an Earn read, and keep the endpoint name", () => {
    const sanitized = JSON.stringify(
      actionSanitizer({
        type: `${earnApi.reducerPath}/executeQuery/fulfilled`,
        payload: { positions: [{ id: STAKE_ACCOUNT, ownerAddress: WALLET_ADDRESS }] },
        meta: {
          arg: {
            endpointName: "getEarnPositions",
            originalArgs: { network: "solana", address: WALLET_ADDRESS },
            queryCacheKey: `getEarnPositions({"address":"${WALLET_ADDRESS}","network":"solana"})`,
          },
          requestId: "request-e",
        },
      }),
    );

    expect(sanitized).not.toContain(WALLET_ADDRESS);
    expect(sanitized).not.toContain(STAKE_ACCOUNT);
    expect(sanitized).toContain("getEarnPositions");
    expect(sanitized).toContain("request-e");
  });

  it("should still drop the credentials a Card action carries", () => {
    const sanitized = JSON.stringify(
      actionSanitizer({
        type: `${CARD_REDUCER_PATH}/executeMutation/fulfilled`,
        payload: { accessToken: ACCESS_TOKEN },
        meta: { arg: { endpointName: "exchangeAuthorizationCode" }, requestId: "request-c" },
      }),
    );

    expect(sanitized).not.toContain(ACCESS_TOKEN);
    expect(sanitized).toContain("exchangeAuthorizationCode");
  });

  it("should leave an action of another api unchanged", () => {
    const action = { type: "swapApi/executeQuery/fulfilled", payload: { from: "bitcoin" } };

    expect(actionSanitizer(action)).toBe(action);
  });

  it("should replace the Earn slice of the state, and keep the others", () => {
    const sanitized = stateSanitizer({
      [earnApi.reducerPath]: { queries: { [WALLET_ADDRESS]: { data: STAKE_ACCOUNT } } },
      settings: { locale: "en" },
    });

    expect(JSON.stringify(sanitized)).not.toMatch(new RegExp(`${WALLET_ADDRESS}|${STAKE_ACCOUNT}`));
    expect(sanitized).toMatchObject({ settings: { locale: "en" } });
  });
});
