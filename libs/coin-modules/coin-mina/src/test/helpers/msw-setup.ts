import { setCoinConfig } from "../../config";
import {
  TEST_ROSETTA_ENDPOINT,
  TEST_GRAPHQL_ENDPOINT,
  TEST_VALIDATORS_ENDPOINT,
} from "./msw-rosetta.mock";

setCoinConfig(() => ({
  status: { type: "active" },
  infra: {
    API_MINA_ROSETTA_NODE: TEST_ROSETTA_ENDPOINT,
    API_MINA_GRAPHQL_NODE: TEST_GRAPHQL_ENDPOINT,
    API_VALIDATORS_BASE_URL: TEST_VALIDATORS_ENDPOINT,
  },
}));
