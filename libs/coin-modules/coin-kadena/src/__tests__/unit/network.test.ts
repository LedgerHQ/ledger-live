import { fetchAccountBalance, getKadenaPactURL } from "../../api/network";
import { setCoinConfig } from "../../config";
import { KDA_NETWORK } from "../../constants";
import { API_KADENA_ENDPOINT, API_KADENA_PACT_ENDPOINT } from "../fixtures/common.fixtures";

describe("network", () => {
  beforeAll(() => {
    setCoinConfig(() => ({
      status: {
        type: "active",
      },
      infra: {
        API_KADENA_ENDPOINT,
        API_KADENA_PACT_ENDPOINT,
        API_KEY_KADENA_ENDPOINT: "",
      },
    }));
  });

  test("fetch balances", async () => {
    const address = "k:77b021744ab3c003e8e4d0f38a598f0e39fe9a7fe61360754dc7321b112ab375";
    const totalBalance = await fetchAccountBalance(address);

    expect(totalBalance).toBeGreaterThan(0);
  });

  test("get kadena pact url", () => {
    const url = getKadenaPactURL("0");
    expect(url).toBe(`${API_KADENA_PACT_ENDPOINT}/chainweb/0.0/${KDA_NETWORK}/chain/0/pact`);
  });
});
