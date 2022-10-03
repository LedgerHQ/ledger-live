/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function CVC({ size, color }: Props): JSX.Element;
declare namespace CVC {
    var DefaultColor: string;
}
export default CVC;
