/// <reference types="react" />
type Props = {
    size?: number | string;
    color?: string;
};
declare function GM({ size, color }: Props): JSX.Element;
declare namespace GM {
    var DefaultColor: string;
}
export default GM;
