import BinTools from 'avalanche/dist/utils/bintools';

export const binTools = BinTools.getInstance();

const isValidAddress = (addr: string) => {
    try {
        binTools.stringToAddress(addr);
        return true;
    } catch (err) {
        return false;
    }
}

export { isValidAddress };