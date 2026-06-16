import { Route, Routes } from "react-router-dom";
import CryptoIcons from "./pages/crypto-icons";
import DevToolsPage from "./pages/dev-tools";
import Home from "./pages/index";
import LldSignatures from "./pages/lld-signatures";
import LogsViewer from "./pages/logsviewer";
import NetworkTroubleshoot from "./pages/networkTroubleshoot";
import Repl from "./pages/repl";
import Sync from "./pages/sync";
import Trustchain from "./pages/trustchain";
import PnlCalculator from "./pages/pnl-calculator";

const NotFound = () => <main>Not found</main>;

export const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/lld-signatures" element={<LldSignatures />} />
    <Route path="/logsviewer" element={<LogsViewer />} />
    <Route path="/networkTroubleshoot" element={<NetworkTroubleshoot />} />
    <Route path="/pnl-calculator" element={<PnlCalculator />} />
    <Route path="/sync" element={<Sync />} />
    <Route path="/repl" element={<Repl />} />
    <Route path="/trustchain" element={<Trustchain />} />
    <Route path="/crypto-icons" element={<CryptoIcons />} />
    <Route path="/dev-tools" element={<DevToolsPage />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);
