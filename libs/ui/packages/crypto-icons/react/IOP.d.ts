/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function IOP({ size, color }: Props): JSX.Element;
declare namespace IOP {
    var DefaultColor: string;
}
export default IOP;
