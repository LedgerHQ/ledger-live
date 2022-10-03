/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function CDN({ size, color }: Props): JSX.Element;
declare namespace CDN {
    var DefaultColor: string;
}
export default CDN;
