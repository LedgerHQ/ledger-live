import { resolveSuiTransport } from "./setup";

/**
 * Calls `resolveSuiTransport` with payloads that violate its declared type — deliberately: remote
 * flag configs arrive unvalidated, so the guards must hold for shapes TypeScript rejects. The single
 * assertion lives here rather than in every case.
 */
const resolveUnvalidated = (feature: unknown) =>
  resolveSuiTransport(feature as Parameters<typeof resolveSuiTransport>[0]);

describe("resolveSuiTransport", () => {
  describe("when the flag is enabled with a transport param", () => {
    it.each(["json", "grpc", "graphql"] as const)("returns %s from params", transport => {
      expect(resolveSuiTransport({ enabled: true, params: { transport } })).toBe(transport);
    });
  });

  // JSON-RPC is the production transport. Every incomplete or absent flag state must land there — a
  // wrong default silently repoints the network layer for every user.
  describe("defaults to json", () => {
    it.each([
      ["flag disabled", { enabled: false }],
      ["flag disabled with a params value", { enabled: false, params: { transport: "grpc" } }],
      ["enabled but no params", { enabled: true }],
      ["enabled but empty params", { enabled: true, params: {} }],
      ["flag undefined", undefined],
      ["flag null", null],
      // Under a truthiness test each of these would switch the transport on, defeating the
      // kill-switch.
      ["enabled is the string 'false'", { enabled: "false", params: { transport: "grpc" } }],
      ["enabled is a truthy number", { enabled: 1, params: { transport: "grpc" } }],
      ["enabled is a non-empty string", { enabled: "true", params: { transport: "grpc" } }],
      ["enabled is missing", { params: { transport: "grpc" } }],
    ] as const)("%s", (_label, feature) => {
      expect(resolveUnvalidated(feature)).toBe("json");
    });

    it("takes no argument at all", () => {
      expect(resolveSuiTransport()).toBe("json");
    });
  });

  // An unrecognised value must fall back, never reach a caller typed as `SuiTransport`.
  describe("rejects a malformed enabled payload", () => {
    it.each([
      ["unknown transport", "foo"],
      ["wrong case", "GRPC"],
      ["empty string", ""],
      ["numeric", 3],
      ["null transport", null],
      ["object", { transport: "grpc" }],
    ])("%s", (_label, transport) => {
      expect(resolveUnvalidated({ enabled: true, params: { transport } })).toBe("json");
    });
  });
});
