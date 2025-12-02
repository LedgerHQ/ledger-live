/// <reference types="react" />
type Props = {
    size?: number | string;
    color?: string;
};
declare function HILO({ size, color }: Props): JSX.Element;
declare namespace HILO {
    var DefaultColor: string;
}
export default HILO;
