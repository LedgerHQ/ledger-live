import { useNavigate } from "react-router-dom";
import {
  NavBar,
  NavBarBackButton,
  NavBarDescription,
  NavBarLeading,
  NavBarTitle,
} from "@ledgerhq/lumen-ui-react";
import { LEDGER_LIVE_INTERACTIVE } from "./ledgerLiveTokens";

export function PnlCalculatorNavBar() {
  const navigate = useNavigate();

  return (
    <NavBar>
      <NavBarBackButton onClick={() => navigate("/")} aria-label="Back to home" />
      <NavBarLeading>
        <NavBarTitle as="h1">PnL calculator</NavBarTitle>
        <NavBarDescription>
          <code className="body-3" style={LEDGER_LIVE_INTERACTIVE}>
            @ledgerhq/wallet-pnl
          </code>
        </NavBarDescription>
      </NavBarLeading>
    </NavBar>
  );
}
