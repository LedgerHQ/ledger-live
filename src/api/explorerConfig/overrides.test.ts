import {
  applyEndpointConfigOverrides,
  applyFullConfigOverrides,
  asFullConfigOverrides,
} from "./overrides";
import { setEnv } from "../../env";
import { getUserHashes } from "../../user";
import { EndpointConfig, FullConfig } from "./types";
beforeEach(() => {
  setEnv("USER_ID", "");
});
describe("applyEndpointConfigOverrides", () => {
  it("keep ref on noop", () => {
    const ref: EndpointConfig = {
      base: "EXPLORER",
      version: "v2",
    };
    expect(applyEndpointConfigOverrides(ref, {})).toBe(ref);
  });
  it("update version", () => {
    expect(
      applyEndpointConfigOverrides(
        {
          base: "EXPLORER",
          version: "v2",
        },
        {
          version: "v3",
        }
      )
    ).toEqual({
      base: "EXPLORER",
      version: "v3",
    });
  });
  it("update version with threshold", () => {
    expect(
      applyEndpointConfigOverrides(
        {
          base: "EXPLORER",
          version: "v2",
        },
        {
          version: "v3",
          overrides_X_out_of_100: 1,
        }
      )
    ).toEqual({
      base: "EXPLORER",
      version: "v2",
    });
  });
  it("update version with threshold", () => {
    expect(
      applyEndpointConfigOverrides(
        {
          base: "EXPLORER",
          version: "v2",
        },
        {
          version: "v3",
          overrides_X_out_of_100: 99,
        }
      )
    ).toEqual({
      base: "EXPLORER",
      version: "v3",
    });
  });
  it("update version with threshold changes from one user to another", () => {
    expect(
      ["a0", "b1", "c2", "d3"].map((id) => {
        setEnv("USER_ID", id);
        return applyEndpointConfigOverrides(
          {
            base: "EXPLORER",
            version: "v2",
          },
          {
            version: "v3",
            overrides_X_out_of_100: 50,
          }
        ).version;
      })
    ).toEqual(["v3", "v2", "v2", "v3"]);
  });
});
describe("FullConfigOverrides", () => {
  const base: FullConfig = {
    dash: {
      id: "dash",
      stable: {
        base: "EXPLORER",
        version: "v3",
      },
    },
    bitcoin_cash: {
      id: "abc",
      stable: {
        base: "EXPLORER",
        version: "v2",
      },
    },
    bitcoin_gold: {
      id: "btg",
      stable: {
        base: "EXPLORER",
        version: "v2",
      },
    },
    bitcoin_testnet: {
      id: "btc_testnet",
      stable: {
        base: "EXPLORER",
        version: "v2",
      },
      experimental: {
        base: "EXPLORER",
        version: "v3",
      },
    },
  };
  const example = {
    dash: {
      stable: {
        version: "v2",
        overrides_X_out_of_100: 80,
      },
    },
    bitcoin_cash: {
      stable: {
        version: "v3",
      },
    },
    bitcoin_testnet: {
      experimental: {
        version: "v2",
      },
    },
  };
  it("parse an example config file", () => {
    expect(asFullConfigOverrides(example)).toEqual(example);
  });
  it("keep ref on noop", () => {
    expect(applyFullConfigOverrides(base, {})).toBe(base);
  });
  it("apply the full example", () => {
    setEnv("USER_ID", "a");
    expect(getUserHashes()).toMatchObject({
      endpointOverrides100: 51,
    });
    const r = applyFullConfigOverrides(base, asFullConfigOverrides(example));
    expect(r).not.toEqual(base);
    expect(r).toEqual({
      dash: {
        id: "dash",
        stable: {
          base: "EXPLORER",
          version: "v2",
        },
      },
      bitcoin_cash: {
        id: "abc",
        stable: {
          base: "EXPLORER",
          version: "v3",
        },
      },
      bitcoin_gold: {
        id: "btg",
        stable: {
          base: "EXPLORER",
          version: "v2",
        },
      },
      bitcoin_testnet: {
        id: "btc_testnet",
        stable: {
          base: "EXPLORER",
          version: "v2",
        },
        experimental: {
          base: "EXPLORER",
          version: "v2",
        },
      },
    });
  });
});
