/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function AE({ size, color }: Props): JSX.Element;
declare namespace AE {
    var DefaultColor: string;
}
export default AE;
