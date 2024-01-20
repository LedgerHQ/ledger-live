import { useSelector, useDispatch } from "react-redux";
import {
    analyticsEnabledSelector,
    personnalizedRecommendationsEnabledSelector,
} from "~/reducers/settings";
import { setAnalytics, setPersonnalizedRecommendations } from "~/actions/settings";

const useAnalyticsOptInPrompt = () => {
    const dispatch = useDispatch();
    const analyticsEnabled: boolean = useSelector(analyticsEnabledSelector);
    const personnalizedRecommendationsEnabled: boolean = useSelector(
        personnalizedRecommendationsEnabledSelector,
    );

    const toggleAnalytics = (value: boolean) => dispatch(setAnalytics(value));
    const togglePersonnalizedRecommendations = (value: boolean) =>
        dispatch(setPersonnalizedRecommendations(value));

    const clickOnRefuseAnalytics = () => { };
    const clickOnAllowAnalytics = () => { };
    const clickOnAllowPersonnalizedExperience = () => { };
    const clickOnRefusePersonnalizedExperience = () => { };
    const clickOnLearnMore = () => { };

    return {
        analyticsEnabled,
        personnalizedRecommendationsEnabled,
        toggleAnalytics,
        togglePersonnalizedRecommendations,
        clickOnRefuseAnalytics,
        clickOnAllowAnalytics,
        clickOnAllowPersonnalizedExperience,
        clickOnRefusePersonnalizedExperience,
        clickOnLearnMore,
    };
};

export default useAnalyticsOptInPrompt;
