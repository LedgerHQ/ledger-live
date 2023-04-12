import type { DomainServiceResolution as DomainDescriptor } from "@ledgerhq/domain-service/types";
import ledgerService from "../../services/ledger";
import type Eth from "../../Eth";

/**
 * @ignore for the README
 *
 * This method will execute the pipeline of actions necessary for clear signing domains.
 * Signature is provided by the backend used in @ledgerhq/domain-service
 */
export const domainResolutionFlow = async (
  appBinding: Eth,
  domainDescriptor: DomainDescriptor
): Promise<void> => {
  if (!domainDescriptor) return;
  const { domain, address, registry, type } = domainDescriptor;

  const challenge = await appBinding.getChallenge();
  const domainAPDU =
    type === "forward"
      ? await ledgerService.signDomainResolution(domain, registry, challenge)
      : await ledgerService.signAddressResolution(address, registry, challenge);

  if (domainAPDU) {
    await appBinding.provideDomainName(domainAPDU);
  }
};
