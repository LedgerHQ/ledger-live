// @flow
import React, { useCallback, useState } from "react";
import { StyleSheet, View, Dimensions, Image, Pressable } from "react-native";
import { TabView, SceneMap } from "react-native-tab-view";
import Svg, { Ellipse } from "react-native-svg";
import { useTheme } from "@react-navigation/native";
import { TrackScreen } from "../../analytics";
import { ScreenName } from "../../const";
import LText from "../../components/LText";
import ConfirmationModal from "../../components/ConfirmationModal";
import AnimatedHeaderView from "../../components/AnimatedHeader";
import onboardingQuizzCorrectAnswer from "./assets/onboardingQuizzCorrectAnswer.png";
import onboardingQuizzWrongAnswer from "./assets/onboardingQuizzWrongAnswer.png";

import quizImage1 from "./assets/quizImage1.png";
import quizImage2 from "./assets/quizImage2.png";
import quizImage3 from "./assets/quizImage3.png";

import quizScenes from "./shared/quizData";
import Touchable from "../../components/Touchable";

const images = [quizImage1, quizImage2, quizImage3];

const InfoView = ({
  label,
  title,
  image,
  answers,
  onPress,
  index,
}: {
  label: React$Node,
  title: React$Node,
  image: number,
  answers: {
    title: React$Node,
    correct: boolean,
  }[],
  onPress: boolean => void,
  index: number,
}) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.root]}>
      <TrackScreen category="Onboarding" name={`Quizz step ${index}`} />
      <View style={styles.container}>
        <LText style={[styles.label, { color: colors.live }]} bold>
          {label}
        </LText>
        <LText bold style={styles.title}>
          {title}
        </LText>
        <View style={[styles.answerContainer]}>
          {answers.map(({ title, correct }, i) => (
            <Touchable
              key={i}
              event={`Onboarding - Quizz step ${index} ${
                correct ? "correct" : "false"
              }`}
              style={[styles.answer, { backgroundColor: colors.lightLive }]}
              onPress={() => onPress(correct)}
            >
              <LText
                semiBold
                style={[styles.answerText, { color: colors.live }]}
              >
                {title}
              </LText>
            </Touchable>
          ))}
        </View>
      </View>

      <Image style={styles.image} source={image} resizeMode="cover" />
    </View>
  );
};

const routeKeys = quizScenes.map((k, i) => ({ key: `${i}` }));

const initialLayout = { width: Dimensions.get("window").width };

function OnboardingQuizz({ navigation, route }: *) {
  const { colors } = useTheme();
  const [index, setIndex] = useState(0);
  const [routes] = useState(routeKeys);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [userAnswers, setAnswers] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState(null);

  const onClickAnswer = useCallback(correct => {
    setAnswers(a => (correct ? a + 1 : a));
    setCurrentAnswer(correct);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const onModalHide = useCallback(() => {
    if (index + 1 === quizScenes.length) {
      navigation.navigate(ScreenName.OnboardingQuizFinal, {
        ...route.params,
        success: userAnswers >= 2,
      });
    } else {
      setIndex(i => Math.min(i + 1, quizScenes.length - 1));
    }
  }, [index, navigation, route.params, userAnswers]);

  const renderScene = SceneMap(
    quizScenes.reduce(
      (sum, k, i) => ({
        ...sum,
        [i]: () => (
          <InfoView
            label={k.label}
            title={k.title}
            image={images[i]}
            answers={k.answers}
            onPress={onClickAnswer}
            index={i + 1}
          />
        ),
      }),
      {},
    ),
  );

  const currentScene = quizScenes[index];
  return (
    <>
      <AnimatedHeaderView
        style={[styles.header, { backgroundColor: colors.lightLive }]}
        title={null}
        hasBackButton
      />
      <View
        style={[
          styles.root,
          {
            backgroundColor: colors.lightLive,
          },
        ]}
      >
        <TrackScreen category="Onboarding" name="Quizz" />
        <TabView
          renderTabBar={() => null}
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={initialLayout}
          swipeEnabled={false}
        />
        <Svg
          pointerEvents="none"
          style={styles.svg}
          viewBox="0 0 320 196"
          fill="none"
        >
          <Ellipse cx="165" cy="208.22" rx="507" ry="208.032" fill="#495D7F" />
        </Svg>
        <View style={styles.dotContainer}>
          {quizScenes.map((k, i) => (
            <Pressable
              key={i}
              style={[
                styles.dot,
                index >= i
                  ? { backgroundColor: "#FFF" }
                  : { backgroundColor: colors.translucentGrey },
              ]}
            >
              <View />
            </Pressable>
          ))}
        </View>
      </View>
      <ConfirmationModal
        isOpened={isModalOpen}
        hideRejectButton
        image={
          currentAnswer
            ? onboardingQuizzCorrectAnswer
            : onboardingQuizzWrongAnswer
        }
        confirmationTitle={
          currentScene.modal[currentAnswer ? "success" : "fail"]
        }
        confirmationDesc={currentScene.modal.text}
        confirmButtonText={currentScene.modal.cta}
        onConfirm={closeModal}
        onModalHide={onModalHide}
        preventBackdropClick
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: { flex: 0 },
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "flex-start",
    zIndex: 10,
  },
  label: {
    paddingHorizontal: 24,
    textAlign: "center",
    fontSize: 10,
    textTransform: "uppercase",
  },
  title: {
    paddingHorizontal: 24,
    textAlign: "center",
    fontSize: 22,
    marginVertical: 4,
  },
  image: {
    position: "absolute",
    bottom: 0,
    left: 0,
    height: "40%",
    width: "100%",
    zIndex: -1,
  },
  dotContainer: {
    position: "absolute",
    bottom: 24,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    zIndex: 0,
  },
  dot: { width: 8, height: 8, margin: 4, borderRadius: 8 },
  answerContainer: {
    padding: 24,
    marginBottom: 24,
    zIndex: 12,
  },
  answer: {
    borderRadius: 4,
    marginBottom: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignContent: "center",
    justifyContent: "center",
  },
  answerText: {
    textAlign: "center",
    fontSize: 16,
  },
  svg: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "100%",
    height: "35%",
    zIndex: -1,
  },
});

export default OnboardingQuizz;
