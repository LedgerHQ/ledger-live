/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function QRL({ size, color }: Props): JSX.Element;
declare namespace QRL {
    var DefaultColor: string;
}
export default QRL;
