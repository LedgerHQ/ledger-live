/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function BTS({ size, color }: Props): JSX.Element;
declare namespace BTS {
    var DefaultColor: string;
}
export default BTS;
