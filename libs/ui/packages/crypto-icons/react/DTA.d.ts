/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function DTA({ size, color }: Props): JSX.Element;
declare namespace DTA {
    var DefaultColor: string;
}
export default DTA;
