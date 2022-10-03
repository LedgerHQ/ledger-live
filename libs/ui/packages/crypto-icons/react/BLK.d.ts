/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function BLK({ size, color }: Props): JSX.Element;
declare namespace BLK {
    var DefaultColor: string;
}
export default BLK;
