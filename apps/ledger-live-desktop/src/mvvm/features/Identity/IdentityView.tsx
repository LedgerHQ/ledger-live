import React from "react";
import {
  IconButton,
  ListItem,
  ListItemLeading,
  ListItemContent,
  ListItemTitle,
  ListItemDescription,
  ListItemTrailing,
  ListItemSpot,
  Tag,
} from "@ledgerhq/lumen-ui-react";
import { ArrowLeft, ShieldCheck } from "@ledgerhq/lumen-ui-react/symbols";
import QRCode from "~/renderer/components/QRCode";
import type { IdentityViewModel } from "./useIdentityViewModel";

export function IdentityView({
  isVerified,
  attestation,
  qrCodeData,
  handleBack,
}: IdentityViewModel) {
  return (
    <div className="mx-auto flex w-full max-w-[600px] flex-col gap-32 py-40">
      {/* Header */}
      <div className="flex items-center gap-12">
        <IconButton
          appearance="transparent"
          size="sm"
          icon={ArrowLeft}
          aria-label="Go back"
          onClick={handleBack}
          data-testid="identity-back-button"
        />
        <h1 className="heading-3">Identity</h1>
      </div>

      {isVerified ? (
        <ProofDisplay minimumAge={attestation.minimumAge} />
      ) : (
        <VerifyPrompt qrCodeData={qrCodeData} />
      )}
    </div>
  );
}

function VerifyPrompt({ qrCodeData }: { qrCodeData: string }) {
  return (
    <div className="flex flex-col items-center gap-32">
      <div className="flex flex-col items-center gap-8 text-center">
        <h2 className="heading-4">Verify your identity</h2>
        <p className="body-2 text-muted">
          Scan this QR code with Ledger Mobile to securely verify your identity document and
          generate your first zero-knowledge proofs.
        </p>
      </div>

      <div className="rounded-lg border border-muted p-24">
        <QRCode data={qrCodeData} size={240} />
      </div>

      <div className="flex w-full flex-col items-center gap-12">
        <h3 className="body-1-semi-bold">How it works</h3>
        <p className="body-2 text-center text-muted">
          Your identity is scanned locally on your phone using Ledger Mobile. Cryptographic proofs
          are generated on-device — your personal data never leaves your phone. Only the
          mathematical proof is stored in your Vault.
        </p>
      </div>
    </div>
  );
}

function ProofDisplay({ minimumAge }: { minimumAge: number | null }) {
  return (
    <div className="flex flex-col gap-16">
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
    </div>
  );
}
