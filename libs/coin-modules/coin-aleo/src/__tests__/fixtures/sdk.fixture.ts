import type { PreparedRequestResponse } from "../../types";

export function getMockedPreparedRequestResponse(
  overrides?: Partial<PreparedRequestResponse>,
): PreparedRequestResponse {
  return {
    is_root: true,
    network_id: 1,
    program_id: "credits.aleo",
    function_name: "transfer_public",
    inputs: ["aleo1recipient", "1000000u64"],
    input_types: ["address", "u64"],
    ...overrides,
  };
}
