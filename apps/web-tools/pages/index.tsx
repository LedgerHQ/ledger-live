import Link from "next/link";
import { ArrowDown, ArrowRight } from "@ldls/ui-react/symbols";
import { Button } from "@ldls/ui-react";

export const getStaticProps = async () => ({ props: {} });

export default function Home() {
  return (
    <main>
      <div className="flex flex-col gap-4">
        <div className="bg-accent w-20 h-20" />
        <ArrowDown size={40} className="text-accent" />
        <Button appearance="accent" icon={ArrowRight}>Click me</Button>
      </div>
      <ul>
        <li>
          <Link href="/domain-tlv-parser">Domain TLV Parser</Link>
        </li>
        <li>
          <Link href="/derivations">Derivation Paths</Link>
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
        <li>
          <Link href="/trustchain">Trustchain</Link>
        </li>
      </ul>
    </main>
  );
}
