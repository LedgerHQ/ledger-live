import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { createLink } from "@meshconnect/web-link-sdk";
import type { LinkOptions } from "@meshconnect/web-link-sdk";
import TrackPage from "~/renderer/analytics/TrackPage";
import MarketBanner from "LLD/features/MarketBanner";
import PageHeader from "LLD/components/PageHeader";
import { PortfolioViewModelResult } from "./hooks/usePortfolioViewModel";

import OperationsList from "~/renderer/components/OperationsList";
import AssetDistribution from "~/renderer/screens/dashboard/AssetDistribution";
import { Balance } from "./components/Balance";
import QuickActions from "LLD/features/QuickActions";
import { AddAccount } from "./components/AddAccount";
import { PerpsEntryPoint } from "./components/PerpsEntryPoint";
import { BorrowEntryPoint } from "./components/BorrowEntryPoint";
import { PORTFOLIO_TRACKING_PAGE_NAME } from "LLD/utils/constants";
import { Button, Divider } from "@ledgerhq/lumen-ui-react";
import BannerSection from "~/renderer/screens/dashboard/components/Banners/BannerSection";
import { PortfolioBannerContent } from "~/renderer/screens/dashboard/components/Banners/PortfolioBannerContent";
import Assets from "LLD/features/Assets";
import { CryptoAddressesBanner } from "LLD/features/CryptoAddresses/components/Banner";
import { BottomCarouselContentCards } from "LLD/features/DynamicContent/components/BottomCarouselContentCards";
import { fetchMeshPayLinkToken } from "~/renderer/meshPay";

const MESH_PAY_CONTAINER_ID = "mesh-pay-container";

type MeshPayTransferFinishedPayload = Parameters<NonNullable<LinkOptions["onTransferFinished"]>>[0];

export const PortfolioView = memo(function PortfolioView({
  totalAccounts,
  totalOperations,
  totalCurrencies,
  hasExchangeBannerCTA,
  shouldDisplayMarketBanner,
  shouldDisplayGraphRework,
  shouldDisplayQuickActionCtas,
  shouldDisplayAssetSection,
  shouldDisplayBorrowSection,
  shouldDisplayOperationsList,
  shouldDisplayBrazePlacement,
  isWallet40Enabled,
  accounts,
  filterOperations,
  t,
  isClearCacheBannerVisible,
}: PortfolioViewModelResult) {
  const shouldDisplayAddAccountCta =
    totalAccounts === 0 && isWallet40Enabled && !shouldDisplayAssetSection;
  const shouldRenderLegacyOperationsList = !shouldDisplayOperationsList && totalOperations > 0;

  return (
    <>
      <div className={isClearCacheBannerVisible && isWallet40Enabled ? "mb-32" : undefined}>
        <BannerSection topBannerAlerts={true} portfolioBannerContent={false} />
      </div>
      <TrackPage
        category={PORTFOLIO_TRACKING_PAGE_NAME}
        totalAccounts={totalAccounts}
        totalOperations={totalOperations}
        totalCurrencies={totalCurrencies}
        hasExchangeBannerCTA={hasExchangeBannerCTA}
      />
      <div id="portfolio-container" data-testid="portfolio-container" className="flex flex-col">
        {/* Main content area */}
        <div className="flex flex-1 flex-col gap-32 pb-32">
          <div className="flex flex-col gap-24">
            <PageHeader title={t("portfolio.title")} />
            <MeshPayButton />
            {shouldDisplayGraphRework && <Balance />}
            {shouldDisplayQuickActionCtas && (
              <QuickActions trackingPageName={PORTFOLIO_TRACKING_PAGE_NAME} />
            )}
            {shouldDisplayQuickActionCtas && <Divider orientation="horizontal" className="mb-8" />}
          </div>

          <PortfolioBannerContent />
          {shouldDisplayMarketBanner && <MarketBanner />}

          <PerpsEntryPoint />
          {shouldDisplayBorrowSection && <BorrowEntryPoint />}

          {shouldDisplayAssetSection ? <Assets /> : <AssetDistribution />}
          {shouldDisplayAddAccountCta && <AddAccount />}
          {shouldDisplayAssetSection && <CryptoAddressesBanner />}
          {shouldDisplayBrazePlacement && <BottomCarouselContentCards />}
          {shouldRenderLegacyOperationsList && (
            <OperationsList
              accounts={accounts}
              title={t("dashboard.recentActivity")}
              withAccount
              withSubAccounts
              filterOperation={filterOperations}
              t={t}
              isWallet40={isWallet40Enabled}
            />
          )}
        </div>
      </div>
    </>
  );
});

function MeshPayButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isOpeningMeshPay, setIsOpeningMeshPay] = useState(false);
  const [pendingMeshPayTransfer, setPendingMeshPayTransfer] =
    useState<MeshPayTransferFinishedPayload | null>(null);
  const meshLinkRef = useRef<ReturnType<typeof createLink> | null>(null);

  const handleMeshPayExit = useCallback(() => {
    console.log("[MESH LINK exited]");
    setIsDialogOpen(false);
  }, []);

  useEffect(() => {
    meshLinkRef.current = createLink({
      renderType: "embedded",
      theme: "system",
      language: navigator.language || "en",
      displayFiatCurrency: "EUR",
      onIntegrationConnected: payload => {
        console.log("[MESH LINK integration connected]", payload);
      },
      onTransferFinished: payload => {
        console.log("[MESH LINK transfer finished]", payload);
        setPendingMeshPayTransfer(payload);
      },
      onExit: () => {
        handleMeshPayExit();
      },
      onEvent: event => {
        console.log("[MESH LINK event]", event);
      },
    });

    return () => {
      meshLinkRef.current = null;
    };
  }, [handleMeshPayExit]);

  const handleOpenMeshPay = useCallback(async () => {
    console.log("[MESH PAY button clicked]");
    setIsDialogOpen(true);
    setIsOpeningMeshPay(true);

    try {
      console.log("[MESH PAY fetching link token]");
      const linkToken = await fetchMeshPayLinkToken();
      console.log("[MESH PAY opening link]", { hasLinkToken: Boolean(linkToken) });
      meshLinkRef.current?.openLink(linkToken, MESH_PAY_CONTAINER_ID);
    } catch (error) {
      console.error("[MESH LINK open failed]", error);
      setIsDialogOpen(false);
    } finally {
      setIsOpeningMeshPay(false);
    }
  }, []);

  const handleCloseMeshPay = useCallback(() => {
    console.log("[MESH PAY dialog closed]");
    meshLinkRef.current?.closeLink();
  }, []);

  return (
    <>
      <div>
        <div className="flex gap-8">
          <Button size="sm" onClick={handleOpenMeshPay} data-testid="mesh-pay-button">
            {isOpeningMeshPay ? "Preparing deposit..." : "Direct deposit"}
          </Button>
        </div>
        <div style={{ marginTop: 8 }}>Securely send to the correct address and network.</div>
      </div>
      {pendingMeshPayTransfer ? (
        <div role="status" style={{ marginTop: 8 }}>
          Deposit pending
        </div>
      ) : null}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Mesh Pay"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 10000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
          background: "rgba(0, 0, 0, 0.72)",
          opacity: isDialogOpen ? 1 : 0,
          pointerEvents: isDialogOpen ? "auto" : "none",
          visibility: isDialogOpen ? "visible" : "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "min(1200px, 96vw)",
            height: "calc(100dvh - 64px)",
            overflow: "hidden",
            borderRadius: 16,
            boxShadow: "0 24px 80px rgba(0, 0, 0, 0.4)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 20px",
              borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
            }}
          >
            <strong>Mesh Pay</strong>
            <Button size="sm" appearance="transparent" onClick={handleCloseMeshPay}>
              Close
            </Button>
          </div>
          {isDialogOpen ? (
            <iframe
              id={MESH_PAY_CONTAINER_ID}
              title="Mesh Pay"
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                flex: 1,
                border: 0,
              }}
            />
          ) : null}
        </div>
      </div>
    </>
  );
}
