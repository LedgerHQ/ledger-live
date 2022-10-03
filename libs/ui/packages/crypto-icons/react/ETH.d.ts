/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function ETH({ size, color }: Props): JSX.Element;
declare namespace ETH {
    var DefaultColor: string;
}
export default ETH;
