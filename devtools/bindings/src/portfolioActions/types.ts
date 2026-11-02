import type { DevToolsConfig } from "@devtools/registry";

/** The tool's contract with its host, as the registry types it. */
export type AccountPortfolioToolProps = Extract<
  DevToolsConfig[number],
  { id: "account-portfolio" }
>["config"];

export type PortfolioRequest = Parameters<AccountPortfolioToolProps["onRun"]>[0];
export type PortfolioAction = PortfolioRequest["action"];
export type PortfolioResult = Awaited<ReturnType<AccountPortfolioToolProps["onRun"]>>;
export type PortfolioView = NonNullable<PortfolioResult["view"]>;
