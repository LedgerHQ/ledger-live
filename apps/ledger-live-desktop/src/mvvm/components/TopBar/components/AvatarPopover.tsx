import React, { useRef, useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import {
  Avatar,
  IconButton,
  TileButton,
  ListItem,
  ListItemLeading,
  ListItemContent,
  ListItemTitle,
  ListItemDescription,
  ListItemTrailing,
  ListItemSpot,
  Tag,
} from "@ledgerhq/lumen-ui-react";
import {
  User,
  Bell,
  Settings,
  ShieldCheck,
  LifeRing,
  IdCard,
  ChevronRight,
  ExternalLink,
  ArrowLeft,
} from "@ledgerhq/lumen-ui-react/symbols";
import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import { useAvatarPopover } from "../hooks/useAvatarPopover";
import { TopBarActionButton } from "./TopBarActionButton";
import {
  isAgeVerifiedSelector,
  ageAttestationSelector,
} from "~/renderer/reducers/ageAttestation";
import QRCode from "~/renderer/components/QRCode";

type PanelView = "menu" | "identity";

export function AvatarPopover() {
  const { t } = useTranslation();
  const {
    open,
    setOpen,
    handleSettingsClick,
    handleNotificationsClick,
    handleRecoverClick,
    handleHelpClick,
    handleMyLedgerClick,
    handleExploreDevicesClick,
    isRecoverEnabled,
    isIdentityEnabled,
  } = useAvatarPopover();

  const isVerified = useSelector(isAgeVerifiedSelector);
  const attestation = useSelector(ageAttestationSelector);

  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelPos, setPanelPos] = useState<{ top: number; right: number } | null>(null);
  const [view, setView] = useState<PanelView>("menu");

  const handleToggle = useCallback(() => {
    setOpen(prev => {
      if (prev) setView("menu");
      return !prev;
    });
  }, [setOpen]);

  const handleIdentityClick = useCallback(() => setView("identity"), []);
  const handleBackToMenu = useCallback(() => setView("menu"), []);

  useEffect(() => {
    if (!open) {
      setView("menu");
      return;
    }
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPanelPos({
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      )
        return;
      setOpen(false);
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, setOpen]);

  return (
    <>
      <div ref={triggerRef}>
        <TopBarActionButton
          label="profile"
          icon={User}
          isInteractive
          onClick={handleToggle}
        />
      </div>

      {open &&
        panelPos &&
        createPortal(
          <div
            ref={panelRef}
            className="fixed z-50 w-[360px] rounded-md bg-surface p-16 drop-shadow-lg"
            style={{ top: panelPos.top, right: panelPos.right }}
          >
            {view === "menu" ? (
              <MenuPanel
                t={t}
                handleNotificationsClick={handleNotificationsClick}
                handleSettingsClick={handleSettingsClick}
                handleRecoverClick={handleRecoverClick}
                handleHelpClick={handleHelpClick}
                handleIdentityClick={handleIdentityClick}
                handleMyLedgerClick={handleMyLedgerClick}
                handleExploreDevicesClick={handleExploreDevicesClick}
                isRecoverEnabled={isRecoverEnabled}
                isIdentityEnabled={isIdentityEnabled}
              />
            ) : (
              <IdentityPanel
                isVerified={isVerified}
                minimumAge={attestation.minimumAge}
                onBack={handleBackToMenu}
              />
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

function MenuPanel({
  t,
  handleNotificationsClick,
  handleSettingsClick,
  handleRecoverClick,
  handleHelpClick,
  handleIdentityClick,
  handleMyLedgerClick,
  handleExploreDevicesClick,
  isRecoverEnabled,
  isIdentityEnabled,
}: {
  t: (key: string) => string;
  handleNotificationsClick: () => void;
  handleSettingsClick: () => void;
  handleRecoverClick: () => void;
  handleHelpClick: () => void;
  handleIdentityClick: () => void;
  handleMyLedgerClick: () => void;
  handleExploreDevicesClick: () => void;
  isRecoverEnabled: boolean;
  isIdentityEnabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-12">
          <Avatar size="md" />
          <span className="body-1-semi-bold text-base">
            {t("topBar.avatarPopover.walletName")}
          </span>
        </div>
        <div className="flex items-center gap-16">
          <IconButton
            appearance="transparent"
            size="sm"
            icon={Bell}
            aria-label={t("topBar.avatarPopover.notifications")}
            onClick={handleNotificationsClick}
            data-testid="avatar-popover-notifications"
          />
          <IconButton
            appearance="transparent"
            size="sm"
            icon={Settings}
            aria-label={t("topBar.avatarPopover.settings")}
            onClick={handleSettingsClick}
            data-testid="avatar-popover-settings"
          />
        </div>
      </div>

      {/* Tile buttons */}
      <div className="flex h-[72px] items-center gap-8">
        {isRecoverEnabled && (
          <TileButton
            icon={ShieldCheck}
            onClick={handleRecoverClick}
            isFull
            data-testid="avatar-popover-recover"
          >
            {t("topBar.avatarPopover.recover")}
          </TileButton>
        )}
        <TileButton
          icon={LifeRing}
          onClick={handleHelpClick}
          isFull
          data-testid="avatar-popover-help"
        >
          {t("topBar.avatarPopover.help")}
        </TileButton>
        {isIdentityEnabled && (
          <TileButton
            icon={IdCard}
            onClick={handleIdentityClick}
            isFull
            data-testid="avatar-popover-identity"
          >
            {t("topBar.avatarPopover.identity")}
          </TileButton>
        )}
      </div>

      {/* List items */}
      <div className="flex flex-col gap-12">
        <div className="rounded-[16px] bg-muted p-4">
          <ListItem onClick={handleMyLedgerClick} data-testid="avatar-popover-my-ledger">
            <ListItemLeading>
              <ListItemSpot appearance="icon" icon={Settings} />
              <ListItemContent>
                <ListItemTitle>{t("topBar.avatarPopover.myLedger")}</ListItemTitle>
                <ListItemDescription>
                  {t("topBar.avatarPopover.myLedgerDescription")}
                </ListItemDescription>
              </ListItemContent>
            </ListItemLeading>
            <ListItemTrailing>
              <ChevronRight size={24} />
            </ListItemTrailing>
          </ListItem>
        </div>

        <div className="rounded-[16px] bg-muted p-4">
          <ListItem
            onClick={handleExploreDevicesClick}
            data-testid="avatar-popover-explore-devices"
          >
            <ListItemLeading>
              <ListItemSpot appearance="icon" icon={Settings} />
              <ListItemContent>
                <ListItemTitle>
                  {t("topBar.avatarPopover.exploreDevices")}
                </ListItemTitle>
              </ListItemContent>
            </ListItemLeading>
            <ListItemTrailing>
              <ExternalLink size={24} />
            </ListItemTrailing>
          </ListItem>
        </div>
      </div>
    </div>
  );
}

function IdentityPanel({
  isVerified,
  minimumAge,
  onBack,
}: {
  isVerified: boolean;
  minimumAge: number | null;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-16">
      {/* Header with back button */}
      <div className="flex items-center gap-8">
        <IconButton
          appearance="transparent"
          size="sm"
          icon={ArrowLeft}
          aria-label="Go back"
          onClick={onBack}
          data-testid="identity-back-button"
        />
        <span className="body-1-semi-bold text-base">Identity</span>
      </div>

      {isVerified ? (
        <div className="rounded-[16px] bg-muted p-4">
          <ListItem data-testid="identity-age-proof">
            <ListItemLeading>
              <ListItemSpot appearance="icon" icon={ShieldCheck} />
              <ListItemContent>
                <ListItemTitle>+{minimumAge ?? 18} years old</ListItemTitle>
                <ListItemDescription>Age verification</ListItemDescription>
              </ListItemContent>
            </ListItemLeading>
            <ListItemTrailing>
              <Tag appearance="success" label="Proven" />
            </ListItemTrailing>
          </ListItem>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-16">
          <div className="flex flex-col items-center gap-4 text-center">
            <h2 className="body-1-semi-bold">Verify your identity</h2>
            <p className="body-3 text-muted">
              Scan this QR code with Ledger Mobile to verify your identity.
            </p>
          </div>
          <div className="rounded-lg border border-muted p-16">
            <QRCode data="ledgerlive://ledger-proof" size={180} />
          </div>
          <p className="body-3 text-center text-muted">
            Your data never leaves your phone. Only the cryptographic proof is stored.
          </p>
        </div>
      )}
    </div>
  );
}
