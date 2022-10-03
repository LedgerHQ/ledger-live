/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function NMR({ size, color }: Props): JSX.Element;
declare namespace NMR {
    var DefaultColor: string;
}
export default NMR;
