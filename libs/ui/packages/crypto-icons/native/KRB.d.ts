/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function KRB({ size, color }: Props): JSX.Element;
declare namespace KRB {
    var DefaultColor: string;
}
export default KRB;
