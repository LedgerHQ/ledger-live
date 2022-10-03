/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function NXS({ size, color }: Props): JSX.Element;
declare namespace NXS {
    var DefaultColor: string;
}
export default NXS;
