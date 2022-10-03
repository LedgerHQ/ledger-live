/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function XDN({ size, color }: Props): JSX.Element;
declare namespace XDN {
    var DefaultColor: string;
}
export default XDN;
