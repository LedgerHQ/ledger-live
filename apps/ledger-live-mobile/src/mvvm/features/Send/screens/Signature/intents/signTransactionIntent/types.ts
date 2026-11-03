// The sheet renders through a portal, outside SponsoredSendContext, so the flag comes in here.
export type SignatureExtraProps = Readonly<{
  sponsoredTransfer: boolean;
}>;
