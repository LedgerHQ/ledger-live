// The sheet renders through a portal, outside SponsoredSendContext, so the flag comes in here.
export type SignatureExtraProps = Readonly<{
  /** The transfer a sponsored send signs after its rent payment. */
  sponsoredTransfer: boolean;
}>;
