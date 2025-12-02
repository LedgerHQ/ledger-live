/// <reference types="react" />
type Props = {
    size?: number | string;
    color?: string;
};
declare function SUMO({ size, color }: Props): JSX.Element;
declare namespace SUMO {
    var DefaultColor: string;
}
export default SUMO;
