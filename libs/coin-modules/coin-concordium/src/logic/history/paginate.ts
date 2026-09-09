import type { RawOperation } from "../../types";
import type { RawOperationPage } from "./listOperations";

/**
 * Walks every page the proxy will hand back, newest first.
 *
 * Ported from the generic coin framework's paginator, which a coin module
 * cannot import: `live-common` depends on this package.
 *
 * Errors are deliberately not caught. The next sync resumes from the newest
 * operation stored, so persisting a partial history would move the watermark
 * past the gap and nothing would fetch it again.
 */
export async function paginateOperations(
  fetchPage: (cursor: string | undefined) => Promise<RawOperationPage>,
): Promise<RawOperation[]> {
  const items: RawOperation[] = [];
  const followed = new Set<string>();
  let cursor: string | undefined;

  for (;;) {
    const page = await fetchPage(cursor);
    for (const item of page.items) items.push(item);

    // The only terminator. A page can be empty and still have more behind it:
    // `items` holds what parsed, and this family keeps three transaction types
    // out of dozens, so a page of contract calls yields nothing while the
    // cursor still points at older rows.
    if (!page.next) return items;

    // A `from` the proxy cannot parse is ignored rather than rejected, so a bad
    // cursor replays a page instead of failing. Tracking every cursor catches a
    // longer loop, which comparing against the last one misses. It throws for
    // the reason a failed page does: what came back is a fragment.
    if (followed.has(page.next)) {
      throw new Error(`concordium: transaction cursor ${page.next} was served twice`);
    }

    followed.add(page.next);
    cursor = page.next;
  }
}
