import { createMemoryCacheAdapter } from "../implementations/memory";
import { runCacheAdapterTests } from "./test-helpers";

runCacheAdapterTests({
  name: "Memory",
  createAdapter: createMemoryCacheAdapter,
});
