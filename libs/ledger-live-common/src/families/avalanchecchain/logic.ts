import BinTools from 'avalanche/dist/utils/bintools';
import { Account } from '../../types';

export const binTools = BinTools.getInstance();

const isValidAddress = (addr: string) => {
    try {
        let result = binTools.stringToAddress(addr);
        return true;
    } catch (err) {
        return false;
    }
}

export { isValidAddress };