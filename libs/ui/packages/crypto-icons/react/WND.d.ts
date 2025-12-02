/// <reference types="react" />
type Props = {
    size?: number | string;
    color?: string;
};
declare function WND({ size, color }: Props): JSX.Element;
declare namespace WND {
    var DefaultColor: string;
}
export default WND;
