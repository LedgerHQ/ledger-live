/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function UNITY({ size, color }: Props): JSX.Element;
declare namespace UNITY {
    var DefaultColor: string;
}
export default UNITY;
