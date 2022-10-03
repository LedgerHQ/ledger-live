/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function XVC({ size, color }: Props): JSX.Element;
declare namespace XVC {
    var DefaultColor: string;
}
export default XVC;
