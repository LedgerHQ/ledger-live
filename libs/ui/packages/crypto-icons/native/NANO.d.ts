/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function NANO({ size, color }: Props): JSX.Element;
declare namespace NANO {
    var DefaultColor: string;
}
export default NANO;
