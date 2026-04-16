// Dynamic import ensures polyfill and HTTP interception (static deps above) are
// fully evaluated before Bun links the CLI's CJS dependency graph.
import "../../polyfill";
import "./http-intercept";

await import("../../cli");
