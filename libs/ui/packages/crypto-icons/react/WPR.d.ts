/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function WPR({ size, color }: Props): JSX.Element;
declare namespace WPR {
    var DefaultColor: string;
}
export default WPR;
