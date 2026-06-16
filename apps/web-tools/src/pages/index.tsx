import { useNavigate } from "react-router-dom";
import {
  ThemeProvider,
  Tile,
  TileContent,
  TileTitle,
  TileDescription,
  Spot,
} from "@ledgerhq/lumen-ui-react";
import {
  ChartPie,
  Code,
  ColorPalette,
  LedgerLogo,
  ListEye,
  NetworkWarning,
  Refresh,
  ShieldLock,
  Signature,
  Tools,
} from "@ledgerhq/lumen-ui-react/symbols";

type Tool = {
  to: string;
  title: string;
  description: string;
  icon: typeof Tools;
};

const tools: Tool[] = [
  {
    to: "/lld-signatures",
    title: "LLD Signatures",
    description: "Verify Ledger Live Desktop signatures.",
    icon: Signature,
  },
  {
    to: "/logsviewer",
    title: "Logs Viewer",
    description: "Inspect and replay exported logs.",
    icon: ListEye,
  },
  {
    to: "/networkTroubleshoot",
    title: "Network Troubleshooting",
    description: "Diagnose connectivity and API issues.",
    icon: NetworkWarning,
  },
  {
    to: "/pnl-calculator",
    title: "PnL Calculator",
    description: "Simulate profit and loss scenarios.",
    icon: ChartPie,
  },
  {
    to: "/sync",
    title: "Synchronisation",
    description: "Run account synchronisation flows.",
    icon: Refresh,
  },
  {
    to: "/repl",
    title: "REPL",
    description: "Interactive APDU & live-common console.",
    icon: Code,
  },
  {
    to: "/trustchain",
    title: "Trustchain",
    description: "Manage trustchain members and keys.",
    icon: ShieldLock,
  },
  {
    to: "/crypto-icons",
    title: "Crypto Icons",
    description: "Browse the crypto icon set.",
    icon: ColorPalette,
  },
  {
    to: "/dev-tools",
    title: "Dev Tools",
    description: "Feature flags and developer settings.",
    icon: Tools,
  },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <ThemeProvider colorScheme="system">
      <main className="bg-canvas min-h-screen px-24 py-48">
        <div className="mx-auto flex w-full max-w-960 flex-col gap-32">
          <header className="flex flex-col items-center gap-8 text-center">
            <div className="flex items-center gap-12">
              <LedgerLogo size={32} className="text-base" />
              <h1 className="heading-2 text-base">Web Tools</h1>
            </div>
            <p className="body-2 text-muted">Internal utilities for Ledger Live developers.</p>
          </header>

          <div className="grid grid-cols-1 gap-16 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map(tool => (
              <Tile
                key={tool.to}
                appearance="card"
                aria-label={tool.title}
                onClick={() => navigate(tool.to)}
              >
                <Spot appearance="icon" icon={tool.icon} />
                <TileContent>
                  <TileTitle>{tool.title}</TileTitle>
                  <TileDescription>{tool.description}</TileDescription>
                </TileContent>
              </Tile>
            ))}
          </div>
        </div>
      </main>
    </ThemeProvider>
  );
}
