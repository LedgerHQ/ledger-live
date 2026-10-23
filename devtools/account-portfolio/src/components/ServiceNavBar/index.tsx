import {
  NavBar,
  NavBarDescription,
  NavBarLeading,
  NavBarTitle,
  NavBarTrailing,
  Tag,
} from "@ledgerhq/lumen-ui-react";
import type { AccountPortfolioViewModel } from "../../AccountPortfolio/types";

/** What the tool is, and where its calls go. It stays on screen while the content scrolls. */
export function ServiceNavBar({
  serviceUrl,
}: Readonly<Pick<AccountPortfolioViewModel, "serviceUrl">>) {
  return (
    <NavBar>
      <NavBarLeading>
        <NavBarTitle as="h2">Portfolio API</NavBarTitle>
        <NavBarDescription>{serviceUrl || "Service disabled"}</NavBarDescription>
      </NavBarLeading>
      <NavBarTrailing>
        {serviceUrl ? (
          <Tag appearance="success" size="sm" label="Service" />
        ) : (
          <Tag appearance="error" size="sm" label="Disabled" />
        )}
      </NavBarTrailing>
    </NavBar>
  );
}
