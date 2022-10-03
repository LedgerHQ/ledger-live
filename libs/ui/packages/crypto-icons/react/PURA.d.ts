/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function PURA({ size, color }: Props): JSX.Element;
declare namespace PURA {
    var DefaultColor: string;
}
export default PURA;
