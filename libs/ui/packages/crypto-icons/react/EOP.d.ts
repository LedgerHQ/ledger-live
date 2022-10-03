/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function EOP({ size, color }: Props): JSX.Element;
declare namespace EOP {
    var DefaultColor: string;
}
export default EOP;
