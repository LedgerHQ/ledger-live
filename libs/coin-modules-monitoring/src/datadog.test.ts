import nock from "nock";
import { LogEntry, submitLogs } from "./datadog";

const dist = { min: 1, max: 3, average: 2, p50: 2, p90: 3, p95: 3, p99: 3 };
const entry: LogEntry = {
  duration: 1200,
  currencyName: "Solana",
  coinModuleName: "solana",
  operationType: "sync",
  accountType: "average",
  transactions: 42,
  accountAddressOrXpub: "Hj69wRzkrFuf1Nby4yzPEFHdsmQdMoVYjvDKZSLjZFEp",
  totalNetworkCalls: 3,
  networkCallsByDomain: { "api.example.com": 3 },
  cpu: dist,
  memory: dist,
};

describe("submitLogs", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env, SUBMIT_LOGS: "true", DD_API_KEY: "api-key", DD_DOMAIN: "datadoghq.eu" };
  });

  afterEach(() => {
    process.env = env;
    nock.cleanAll();
  });

  it("should post entries to the Datadog logs intake of the configured site", async () => {
    const scope = nock("https://http-intake.logs.datadoghq.eu", {
      reqheaders: {
        "dd-api-key": "api-key",
        "content-type": "application/json",
        accept: "application/json",
      },
    })
      .post("/api/v2/logs", [
        { ddtags: "env:prd", message: JSON.stringify(entry), service: "coin-modules-monitoring" },
      ])
      .reply(202, {});

    await submitLogs([entry]);

    expect(scope.isDone()).toBe(true);
  });

  it("should default to the datadoghq.eu site when DD_DOMAIN is unset", async () => {
    delete process.env.DD_DOMAIN;
    const scope = nock("https://http-intake.logs.datadoghq.eu").post("/api/v2/logs").reply(202, {});

    await submitLogs([entry]);

    expect(scope.isDone()).toBe(true);
  });

  it("should throw when Datadog rejects the submission", async () => {
    nock("https://http-intake.logs.datadoghq.eu")
      .post("/api/v2/logs")
      .reply(403, { errors: ["Forbidden"] });

    await expect(submitLogs([entry])).rejects.toThrow(
      'Datadog logs submission failed: 403 {"errors":["Forbidden"]}',
    );
  });

  it("should not send anything when SUBMIT_LOGS is unset", async () => {
    delete process.env.SUBMIT_LOGS;
    const scope = nock("https://http-intake.logs.datadoghq.eu").post("/api/v2/logs").reply(202, {});

    await submitLogs([entry]);

    expect(scope.isDone()).toBe(false);
  });
});
