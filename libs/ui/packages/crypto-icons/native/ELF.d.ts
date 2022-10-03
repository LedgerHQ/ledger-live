/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function ELF({ size, color }: Props): JSX.Element;
declare namespace ELF {
    var DefaultColor: string;
}
export default ELF;
