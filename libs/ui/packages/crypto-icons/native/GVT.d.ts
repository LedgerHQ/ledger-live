/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function GVT({ size, color }: Props): JSX.Element;
declare namespace GVT {
    var DefaultColor: string;
}
export default GVT;
