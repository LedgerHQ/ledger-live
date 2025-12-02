/// <reference types="react" />
type Props = {
    size?: number | string;
    color?: string;
};
declare function RIC({ size, color }: Props): JSX.Element;
declare namespace RIC {
    var DefaultColor: string;
}
export default RIC;
