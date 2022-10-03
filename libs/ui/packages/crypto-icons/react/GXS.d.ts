/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function GXS({ size, color }: Props): JSX.Element;
declare namespace GXS {
    var DefaultColor: string;
}
export default GXS;
