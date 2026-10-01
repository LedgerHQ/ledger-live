// Namespaces the renderer may read and write through the bridge. A namespace becomes `<ns>.json`
// under the database directory, so an unchecked one is a path-traversal primitive.
const RENDERER_NAMESPACES = new Set(["app"]);

export function assertRendererNamespace(ns: unknown): asserts ns is string {
  if (typeof ns !== "string" || !RENDERER_NAMESPACES.has(ns)) {
    throw new Error(`Database namespace not allowed from the renderer: ${String(ns)}`);
  }
}
