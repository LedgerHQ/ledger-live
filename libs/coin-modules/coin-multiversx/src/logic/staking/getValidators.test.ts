import { http, HttpResponse } from "msw";
import { getValidators } from "./getValidators";
import { server, useMswServer, testNetworkApi, TEST_DELEGATION_API } from "../tests/msw";

describe("getValidators (msw)", () => {
  useMswServer();

  it("maps enabled providers to validators and filters out disabled ones", async () => {
    server.use(
      http.get(`${TEST_DELEGATION_API}/providers`, () =>
        HttpResponse.json([
          {
            contract: "erd1validator",
            serviceFee: "10",
            aprValue: 8.5,
            identity: { name: "Ledger Validator", url: "https://val.example" },
            disabled: false,
          },
          { contract: "erd1disabled", serviceFee: "5", aprValue: 4, disabled: true },
        ]),
      ),
    );

    const page = await getValidators(testNetworkApi());

    expect(page.items).toHaveLength(1);
    expect(page.items[0]).toMatchObject({
      address: "erd1validator",
      name: "Ledger Validator",
      commissionRate: "10",
      apy: 8.5,
    });
  });
});
