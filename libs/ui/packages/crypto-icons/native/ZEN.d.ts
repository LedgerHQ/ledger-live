/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function ZEN({ size, color }: Props): JSX.Element;
declare namespace ZEN {
    var DefaultColor: string;
}
export default ZEN;
