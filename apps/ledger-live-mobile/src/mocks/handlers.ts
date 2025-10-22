import dadaHandlers from "./dada/handler";
import statusHandlers from "./status/handler";
import { handlers as e2eHandlers } from "../../e2e/handlers";

const handlers =
  process.env.E2E_MSW_ENABLED === "true" ? [...e2eHandlers] : [...dadaHandlers, ...statusHandlers];

export default handlers;
