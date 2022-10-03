/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function GLXT({ size, color }: Props): JSX.Element;
declare namespace GLXT {
    var DefaultColor: string;
}
export default GLXT;
