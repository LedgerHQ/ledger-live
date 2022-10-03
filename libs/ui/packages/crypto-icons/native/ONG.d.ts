/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function ONG({ size, color }: Props): JSX.Element;
declare namespace ONG {
    var DefaultColor: string;
}
export default ONG;
