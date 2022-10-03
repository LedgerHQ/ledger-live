/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function AUDR({ size, color }: Props): JSX.Element;
declare namespace AUDR {
    var DefaultColor: string;
}
export default AUDR;
