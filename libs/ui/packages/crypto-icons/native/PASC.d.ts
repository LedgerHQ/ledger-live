/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function PASC({ size, color }: Props): JSX.Element;
declare namespace PASC {
    var DefaultColor: string;
}
export default PASC;
