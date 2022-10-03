/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function UMA({ size, color }: Props): JSX.Element;
declare namespace UMA {
    var DefaultColor: string;
}
export default UMA;
