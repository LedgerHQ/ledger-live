import { Link } from "react-router-dom";

export default function Home() {
  return (
    <main>
      <ul>
        <li>
          <Link to="/domain-tlv-parser">Domain TLV Parser</Link>
        </li>
        <li>
          <Link to="/derivations">Derivation Paths</Link>
        </li>
        <li>
          <Link to="/eth-tx-tools">ETH Tx Tools</Link>
        </li>
        <li>
          <Link to="/lld-signatures">LLD Signatures</Link>
        </li>
        <li>
          <Link to="/logsviewer">Logs Viewer</Link>
        </li>
        <li>
          <Link to="/networkTroubleshoot">Network Troubleshooting</Link>
        </li>
        <li>
          <Link to="/sync">Synchronisation</Link>
        </li>
        <li>
          <Link to="/repl">REPL</Link>
        </li>
        <li>
          <Link to="/trustchain">Trustchain</Link>
        </li>
        <li>
          <Link to="/crypto-icons">Crypto Icons</Link>
        </li>
      </ul>
    </main>
  );
}
