import { describe, expect, it, jest } from "@jest/globals";
import { z } from "zod";
import { DuplicateConfigValueError } from "./errors";
import { defineConfigSchema } from "./schema";
import type { Zod } from "./types";

describe("defineConfigSchema", () => {
  it("hands the zod namespace to the callback", () => {
    const define = jest.fn((_zod: Zod) => ({ switches: {}, fixed: {} }));

    defineConfigSchema(define);

    expect(define).toHaveBeenCalledWith(z);
  });

  it("keeps the switch and fixed shapes as declared", () => {
    const apiUrl = z.url();
    const clientVersion = z.string();

    const schema = defineConfigSchema(() => ({
      switches: { backend: { apiUrl } },
      fixed: { clientVersion },
    }));

    expect(schema.switches.backend.apiUrl).toBe(apiUrl);
    expect(schema.fixed.clientVersion).toBe(clientVersion);
  });

  it("builds a strict schema of every value, from the switches and the fixed values", () => {
    const schema = defineConfigSchema(zod => ({
      switches: { backend: { apiUrl: zod.url() }, auth: { authUrl: zod.url() } },
      fixed: { clientVersion: zod.string() },
    }));
    const values = {
      apiUrl: "https://api.example.com",
      authUrl: "https://auth.example.com",
      clientVersion: "test/1.0.0",
    };

    const parsed: { apiUrl: string; authUrl: string; clientVersion: string } =
      schema.values.parse(values);

    expect(parsed).toEqual(values);
    expect(() => schema.values.parse({ ...values, undeclared: "value" })).toThrow();
  });

  it.each([
    [
      "two switches",
      { switches: { backend: { apiUrl: z.url() }, otherSwitch: { apiUrl: z.url() } }, fixed: {} },
    ],
    [
      "a switch and the fixed values",
      { switches: { backend: { apiUrl: z.url() } }, fixed: { apiUrl: z.url() } },
    ],
  ])("rejects a value name that %s both declare", (_, definition) => {
    const define = () => defineConfigSchema(() => definition);

    expect(define).toThrow(DuplicateConfigValueError);
    expect(define).toThrow('Config value "apiUrl" is declared more than once in the schema');
  });
});
