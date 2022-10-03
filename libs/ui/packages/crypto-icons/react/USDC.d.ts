/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function USDC({ size, color }: Props): JSX.Element;
declare namespace USDC {
    var DefaultColor: string;
}
export default USDC;
