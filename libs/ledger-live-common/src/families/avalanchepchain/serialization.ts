import BigNumber from "bignumber.js";
import type { AvalanchePChainResourcesRaw, AvalanchePChainResources } from "./types";

export function toAvalanchePChainResourcesRaw(r: AvalanchePChainResources): AvalanchePChainResourcesRaw {
    const {
        publicKey,
        chainCode,
        stakedBalance
    } = r;

    return {
        publicKey,
        chainCode,
        stakedBalance: stakedBalance.toString()
    };
}
export function fromAvalanchePChainResourcesRaw(r: AvalanchePChainResourcesRaw): AvalanchePChainResources {
    const {
        publicKey,
        chainCode,
        stakedBalance
    } = r;

    return {
        publicKey,
        chainCode,
        stakedBalance: new BigNumber(stakedBalance)
    };
}