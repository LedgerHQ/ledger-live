/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function AGRS({ size, color }: Props): JSX.Element;
declare namespace AGRS {
    var DefaultColor: string;
}
export default AGRS;
