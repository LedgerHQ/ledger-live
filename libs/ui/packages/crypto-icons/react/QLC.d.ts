/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function QLC({ size, color }: Props): JSX.Element;
declare namespace QLC {
    var DefaultColor: string;
}
export default QLC;
