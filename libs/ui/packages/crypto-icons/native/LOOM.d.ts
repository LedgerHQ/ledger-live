/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function LOOM({ size, color }: Props): JSX.Element;
declare namespace LOOM {
    var DefaultColor: string;
}
export default LOOM;
