/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function PPC({ size, color }: Props): JSX.Element;
declare namespace PPC {
    var DefaultColor: string;
}
export default PPC;
