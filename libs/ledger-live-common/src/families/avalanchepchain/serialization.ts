import type { AvalanchePChainResourcesRaw, AvalanchePChainResources } from "./types";

export function toAvalanchePChainResourcesRaw(r: AvalanchePChainResources): AvalanchePChainResourcesRaw {
    const {
        publicKey,
        chainCode
    } = r;

    return {
        publicKey,
        chainCode
    };
}
export function fromAvalanchePChainResourcesRaw(r: AvalanchePChainResourcesRaw): AvalanchePChainResources {
    const {
        publicKey,
        chainCode
    } = r;

    return {
        publicKey,
        chainCode
    };
}