/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function WAN({ size, color }: Props): JSX.Element;
declare namespace WAN {
    var DefaultColor: string;
}
export default WAN;
