/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function RDD({ size, color }: Props): JSX.Element;
declare namespace RDD {
    var DefaultColor: string;
}
export default RDD;
