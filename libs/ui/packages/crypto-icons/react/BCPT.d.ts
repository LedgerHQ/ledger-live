/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function BCPT({ size, color }: Props): JSX.Element;
declare namespace BCPT {
    var DefaultColor: string;
}
export default BCPT;
