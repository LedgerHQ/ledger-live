/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function GNT({ size, color }: Props): JSX.Element;
declare namespace GNT {
    var DefaultColor: string;
}
export default GNT;
