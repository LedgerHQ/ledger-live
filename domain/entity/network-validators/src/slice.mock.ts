import { NetworkIdSchema } from "@domain/entity-account-descriptor";
import { mockNetworkValidator } from "./schema.mock";
import type { NetworkValidatorsState } from "./slice";

export const mockNetworkId = NetworkIdSchema.parse("cosmos");

export const mockNetworkValidatorsState = {
  [mockNetworkId]: {
    validators: [
      mockNetworkValidator(),
      mockNetworkValidator({
        id: "cosmosvaloper1other",
        address: "cosmosvaloper1other",
        name: "Other",
      }),
    ],
    receivedAt: 1_700_000_000_000,
  },
} satisfies NetworkValidatorsState;
