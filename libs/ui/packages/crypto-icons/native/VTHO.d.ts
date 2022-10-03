/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function VTHO({ size, color }: Props): JSX.Element;
declare namespace VTHO {
    var DefaultColor: string;
}
export default VTHO;
