import Link from "next/link";

export const getStaticProps = async () => ({ props: {} });

export default function Home() {
  return (
    <main>
      <ul>
        <li>
          <Link href="/domain-tlv-parser">Domain TLV Parser</Link>
        </li>
        <li>
          <Link href="/eth-tx-tools">ETH Tx Tools</Link>
        </li>
        <li>
          <Link href="/lld-signatures">LLD Signatures</Link>
        </li>
        <li>
          <Link href="/logsviewer">Logs Viewer</Link>
        </li>
        <li>
          <Link href="/networkTroubleshoot">Network Troubleshooting</Link>
        </li>
        <li>
          <Link href="/svg-icons">SVG Icons</Link>
        </li>
        <li>
          <Link href="/sync">Synchronisation</Link>
        </li>
        <li>
          <Link href="/repl">REPL</Link>
        </li>
      </ul>
    </main>
  );
}
