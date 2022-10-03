/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function NEXO({ size, color }: Props): JSX.Element;
declare namespace NEXO {
    var DefaultColor: string;
}
export default NEXO;
