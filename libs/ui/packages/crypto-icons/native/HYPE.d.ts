/// <reference types="react" />
type Props = {
    size?: number | string;
    color?: string;
};
declare function HYPE({ size, color }: Props): JSX.Element;
declare namespace HYPE {
    var DefaultColor: string;
}
export default HYPE;
