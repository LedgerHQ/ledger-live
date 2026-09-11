import { useEffect, type ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Link, ThemeProvider } from "@ledgerhq/lumen-ui-react";
import { ArrowLeft } from "@ledgerhq/lumen-ui-react/symbols";

/**
 * A local shell rather than the shared ToolPage, because this page needs two things
 * ToolPage does not offer and that the other tools have no use for: a container wide
 * enough for the matrix, and a single-line header with the collection status beside the
 * title. Everything else — theme, canvas, back link, heading — mirrors ToolPage, so the
 * page still reads as part of the same site.
 */
export function PageShell({
  title,
  actions,
  children,
}: {
  title: string;
  /** Right-aligned content on the title line, for page-level status and actions. */
  actions?: ReactNode;
  children: ReactNode;
}) {
  /*
   * index.html gives every tool the same tab title, and the app has no per-route title
   * handling. The previous title is captured rather than hardcoded, so leaving the page
   * restores it.
   */
  useEffect(() => {
    const previous = document.title;
    document.title = `${title} · ${previous}`;
    return () => {
      document.title = previous;
    };
  }, [title]);

  return (
    <ThemeProvider colorScheme="system">
      <main className="bg-canvas min-h-screen px-24 py-24 body-2 text-base">
        <div className="mx-auto flex w-full min-w-0 max-w-[1280px] flex-col gap-16">
          <header className="flex flex-wrap items-center justify-between gap-x-16 gap-y-8">
            <div className="flex flex-wrap items-center gap-8">
              <Link asChild appearance="accent" size="sm">
                <RouterLink to="/" className="inline-flex items-center gap-4">
                  <ArrowLeft size={16} />
                  Back to tools
                </RouterLink>
              </Link>
              <span className="text-muted-subtle" aria-hidden="true">
                ·
              </span>
              <h1 className="heading-3 text-base">{title}</h1>
            </div>
            {actions ? <div className="flex flex-wrap items-center gap-12">{actions}</div> : null}
          </header>
          {children}
        </div>
      </main>
    </ThemeProvider>
  );
}
