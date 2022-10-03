/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function BCC({ size, color }: Props): JSX.Element;
declare namespace BCC {
    var DefaultColor: string;
}
export default BCC;
