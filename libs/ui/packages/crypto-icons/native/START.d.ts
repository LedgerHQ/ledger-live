/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function START({ size, color }: Props): JSX.Element;
declare namespace START {
    var DefaultColor: string;
}
export default START;
