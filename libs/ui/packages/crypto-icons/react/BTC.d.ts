/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function BTC({ size, color }: Props): JSX.Element;
declare namespace BTC {
    var DefaultColor: string;
}
export default BTC;
