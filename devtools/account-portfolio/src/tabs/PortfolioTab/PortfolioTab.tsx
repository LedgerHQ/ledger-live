import type { AccountPortfolioViewModel } from "../../account-portfolio/viewModelTypes";
import { AddAddressesSection } from "./AddAddressesSection/AddAddressesSection";
import { CreateSection } from "./CreateSection/CreateSection";
import { GetPortfolioSection } from "./GetPortfolioSection/GetPortfolioSection";
import { RegisterSection } from "./RegisterSection/RegisterSection";
import { RemoveSection } from "./RemoveSection/RemoveSection";

/** Everything about the portfolio itself: what a new one needs first, then looking at it and editing it. */
export function PortfolioTab(vm: Readonly<AccountPortfolioViewModel>) {
  return (
    <>
      <p className="body-3 text-muted">
        A new portfolio needs two steps: create it, then register your accounts. Once it exists,
        look at it, or edit it with the cards under &ldquo;Change an existing portfolio&rdquo;.
      </p>
      <CreateSection {...vm} />
      <RegisterSection {...vm} />
      <GetPortfolioSection {...vm} />
      <h3 className="pt-8 body-2-semi-bold text-base">Change an existing portfolio</h3>
      <RemoveSection {...vm} />
      <AddAddressesSection {...vm} />
    </>
  );
}
