/// <reference types="react" />
type Props = {
    size?: number | string;
    color?: string;
};
declare function RAFF({ size, color }: Props): JSX.Element;
declare namespace RAFF {
    var DefaultColor: string;
}
export default RAFF;
