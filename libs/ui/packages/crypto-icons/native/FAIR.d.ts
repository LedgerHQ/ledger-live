/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function FAIR({ size, color }: Props): JSX.Element;
declare namespace FAIR {
    var DefaultColor: string;
}
export default FAIR;
