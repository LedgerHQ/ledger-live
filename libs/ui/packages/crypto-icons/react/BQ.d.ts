/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function BQ({ size, color }: Props): JSX.Element;
declare namespace BQ {
    var DefaultColor: string;
}
export default BQ;
