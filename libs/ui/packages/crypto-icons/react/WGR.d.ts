/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function WGR({ size, color }: Props): JSX.Element;
declare namespace WGR {
    var DefaultColor: string;
}
export default WGR;
