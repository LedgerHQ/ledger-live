/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function SLS({ size, color }: Props): JSX.Element;
declare namespace SLS {
    var DefaultColor: string;
}
export default SLS;
