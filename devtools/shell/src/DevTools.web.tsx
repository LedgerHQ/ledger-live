import { Button, Divider, ThemeProvider } from "@ledgerhq/lumen-ui-react";
import { ledgerLiveThemes } from "@ledgerhq/lumen-design-core";
import { TOOLS } from "./tools.config";
import { Category } from "./types";
import { useAccordion, useDevToolsNavigation } from "./hooks";

export const DevTools = () => {
  const { activeTool, setActiveToolId, categories } = useDevToolsNavigation(TOOLS);
  const { isExpanded, toggle } = useAccordion<Category>();

  return (
    <ThemeProvider themes={ledgerLiveThemes} colorScheme="dark">
      <div data-testid="devtools" className="flex h-full bg-canvas">
        <nav
          data-testid="devtools-nav"
          style={{ width: "18%" }}
          className="bg-surface h-full overflow-y-auto "
        >
          <ul className="flex flex-col flex-1 list-none p-10 gap-10">
            {categories.map(({ category, tools }) => (
              <li key={category} className="flex flex-col">
                <Button
                  appearance="gray"
                  size="md"
                  className="w-full"
                  aria-label={category}
                  aria-expanded={isExpanded(category)}
                  onClick={() => toggle(category)}
                >
                  <span aria-hidden="true">{isExpanded(category) ? "▾" : "▸"}</span>
                  {category}
                </Button>
                {isExpanded(category) && tools.length > 0 && (
                  <ul className="flex flex-col list-none px-10 gap-1">
                    {tools.map(tool => (
                      <li key={tool.id}>
                        <Button
                          appearance={activeTool?.id === tool.id ? "accent" : "transparent"}
                          size="sm"
                          className="w-full"
                          aria-current={activeTool?.id === tool.id ? "page" : undefined}
                          onClick={() => setActiveToolId(tool.id)}
                        >
                          {tool.label}
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
                {isExpanded(category) && tools.length === 0 && (
                  <span className="px-3 py-1 text-xs text-muted">No tools available</span>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <Divider orientation="vertical" />
        <main data-testid="devtools-content" className="flex flex-col flex-1 overflow-auto">
          <span
            className={`block  text-lg font-semibold p-10 text-muted`}
            {...(activeTool === null ? { "data-testid": "devtools-empty" } : {})}
          >
            {activeTool?.label ?? "Select a tool from the sidebar."}
          </span>
          <Divider />
          <div className="flex-1" />
        </main>
      </div>
    </ThemeProvider>
  );
};
