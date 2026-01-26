import { Route, Routes } from "react-router-dom";
import CryptoIcons from "./pages/crypto-icons";
import Derivations from "./pages/derivations";
import DomainTlvParser from "./pages/domain-tlv-parser";
import EthTxTools from "./pages/eth-tx-tools";
import Home from "./pages/index";
import LldSignatures from "./pages/lld-signatures";
import LogsViewer from "./pages/logsviewer";
import NetworkTroubleshoot from "./pages/networkTroubleshoot";
import Repl from "./pages/repl";
import Sync from "./pages/sync";
import Trustchain from "./pages/trustchain";

const NotFound = () => <main>Not found</main>;

export const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/domain-tlv-parser" element={<DomainTlvParser />} />
    <Route path="/derivations" element={<Derivations />} />
    <Route path="/eth-tx-tools" element={<EthTxTools />} />
    <Route path="/lld-signatures" element={<LldSignatures />} />
    <Route path="/logsviewer" element={<LogsViewer />} />
    <Route path="/networkTroubleshoot" element={<NetworkTroubleshoot />} />
    <Route path="/sync" element={<Sync />} />
    <Route path="/repl" element={<Repl />} />
    <Route path="/trustchain" element={<Trustchain />} />
    <Route path="/crypto-icons" element={<CryptoIcons />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);
