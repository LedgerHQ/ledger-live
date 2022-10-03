/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function WICC({ size, color }: Props): JSX.Element;
declare namespace WICC {
    var DefaultColor: string;
}
export default WICC;
