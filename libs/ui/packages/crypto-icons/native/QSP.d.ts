/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function QSP({ size, color }: Props): JSX.Element;
declare namespace QSP {
    var DefaultColor: string;
}
export default QSP;
