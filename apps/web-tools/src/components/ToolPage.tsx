import type { ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Link, ThemeProvider } from "@ledgerhq/lumen-ui-react";
import { ArrowLeft } from "@ledgerhq/lumen-ui-react/symbols";

type ToolPageProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function ToolPage({ title, description, children }: ToolPageProps) {
  return (
    <ThemeProvider colorScheme="system">
      <main className="bg-canvas min-h-screen px-24 py-32 body-2 text-base">
        <div className="mx-auto flex w-full max-w-960 flex-col gap-24">
          <header className="flex flex-col gap-8">
            <Link asChild appearance="accent" size="sm">
              <RouterLink to="/" className="inline-flex items-center gap-4">
                <ArrowLeft size={16} />
                Back to tools
              </RouterLink>
            </Link>
            <h1 className="heading-3 text-base">{title}</h1>
            {description ? <p className="body-2 text-muted">{description}</p> : null}
          </header>
          {children}
        </div>
      </main>
    </ThemeProvider>
  );
}
