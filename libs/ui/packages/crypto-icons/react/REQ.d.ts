/// <reference types="react" />
type Props = {
    size?: number | string;
    color?: string;
};
declare function REQ({ size, color }: Props): JSX.Element;
declare namespace REQ {
    var DefaultColor: string;
}
export default REQ;
