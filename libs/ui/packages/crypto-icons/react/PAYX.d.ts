/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function PAYX({ size, color }: Props): JSX.Element;
declare namespace PAYX {
    var DefaultColor: string;
}
export default PAYX;
