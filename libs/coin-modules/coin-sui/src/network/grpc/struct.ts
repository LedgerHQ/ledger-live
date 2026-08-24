/**
 * `google.protobuf.Value` → plain JSON.
 *
 * gRPC returns Move object contents (`Object.json`) as a protobuf `Value`, a tagged union
 * (`{ kind: { oneofKind: "structValue", structValue: { fields: … } } }`), where GraphQL returns the
 * same data as plain JSON. Unwrapping here lets the transport-neutral helpers in
 * `network/staking.ts` consume gRPC objects unchanged.
 *
 * Typed on `unknown` rather than the SDK's `Value`: that type is not re-exported by `GrpcTypes`,
 * and `@mysten/sui/dist/grpc/proto/*` is not a public entry point.
 *
 * Numbers are passed through as-is. Sui renders Move `u64` as `stringValue` precisely because the
 * range exceeds `Number.MAX_SAFE_INTEGER`, and `isU64Numeric` accepts both forms — so no widening
 * happens here, which would invent precision the wire never carried.
 */
export function protoValueToJson(value: unknown): unknown {
  const kind = (value as { kind?: Record<string, unknown> } | undefined)?.kind;
  if (!kind || typeof kind !== "object") return undefined;

  switch (kind.oneofKind) {
    case "structValue": {
      const fields = (kind.structValue as { fields?: Record<string, unknown> } | undefined)?.fields;
      return Object.fromEntries(
        Object.entries(fields ?? {}).map(([key, field]) => [key, protoValueToJson(field)]),
      );
    }
    case "listValue": {
      const values = (kind.listValue as { values?: unknown[] } | undefined)?.values;
      return (values ?? []).map(protoValueToJson);
    }
    case "stringValue":
      return kind.stringValue;
    case "numberValue":
      return kind.numberValue;
    case "boolValue":
      return kind.boolValue;
    case "nullValue":
      return null;
    default:
      return undefined;
  }
}
