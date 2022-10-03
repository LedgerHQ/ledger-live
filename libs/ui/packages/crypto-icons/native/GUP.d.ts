/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function GUP({ size, color }: Props): JSX.Element;
declare namespace GUP {
    var DefaultColor: string;
}
export default GUP;
