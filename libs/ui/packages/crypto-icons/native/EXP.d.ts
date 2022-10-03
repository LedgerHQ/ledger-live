/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function EXP({ size, color }: Props): JSX.Element;
declare namespace EXP {
    var DefaultColor: string;
}
export default EXP;
