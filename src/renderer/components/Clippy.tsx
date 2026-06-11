import { useEffect, useState, useCallback } from "react";

import { ANIMATIONS, Animation } from "../clippy-animations";
import {
  EMPTY_ANIMATION,
  getRandomIdleAnimation,
} from "../clippy-animation-helpers";
import { clippyApi } from "../clippyApi";
import { log } from "../logging";
import { useDebugState } from "../contexts/DebugContext";

const WAIT_TIME = 6000;

export function Clippy() {
  const { enableDragDebug } = useDebugState();
  const [status, setStatus] = useState<"welcome" | "idle">("welcome");
  const [animation, setAnimation] = useState<Animation>(EMPTY_ANIMATION);
  const [animationTimeoutId, setAnimationTimeoutId] = useState<
    number | undefined
  >(undefined);

  const playAnimation = useCallback(
    (key: string) => {
      if (ANIMATIONS[key]) {
        log(`Playing animation`, { key });

        if (animationTimeoutId) {
          window.clearTimeout(animationTimeoutId);
        }

        setAnimation(ANIMATIONS[key]);
        setAnimationTimeoutId(
          window.setTimeout(() => {
            setAnimation(ANIMATIONS.Default);
          }, ANIMATIONS[key].length + 200),
        );
      } else {
        log(`Animation not found`, { key });
      }
    },
    [animationTimeoutId],
  );

  const openChat = useCallback(() => {
    clippyApi.openChatWindow().catch(console.error);
  }, []);

  // Listen for animation keys forwarded from the chat window
  useEffect(() => {
    clippyApi.offAnimationKey();
    clippyApi.onAnimationKey((key) => {
      log(`New animation key`, { key });
      playAnimation(key);
    });

    return () => {
      clippyApi.offAnimationKey();
    };
  }, [playAnimation]);

  useEffect(() => {
    const playRandomIdleAnimation = () => {
      if (status !== "idle") return;

      const randomIdleAnimation = getRandomIdleAnimation(animation);
      setAnimation(randomIdleAnimation);

      setAnimationTimeoutId(
        window.setTimeout(() => {
          setAnimation(ANIMATIONS.Default);
          setAnimationTimeoutId(
            window.setTimeout(playRandomIdleAnimation, WAIT_TIME),
          );
        }, randomIdleAnimation.length),
      );
    };

    if (status === "welcome" && animation === EMPTY_ANIMATION) {
      setAnimation(ANIMATIONS.Show);
      setTimeout(() => {
        setStatus("idle");
      }, ANIMATIONS.Show.length + 200);
    } else if (status === "idle") {
      if (!animationTimeoutId) {
        playRandomIdleAnimation();
      }
    }

    return () => {
      if (animationTimeoutId) {
        window.clearTimeout(animationTimeoutId);
      }
    };
  }, [status]);

  return (
    <div>
      <div
        className="app-drag"
        style={{
          position: "absolute",
          height: "93px",
          width: "124px",
          backgroundColor: enableDragDebug ? "blue" : "transparent",
          opacity: 0.5,
          zIndex: 5,
        }}
      >
        <div
          className="app-no-drag"
          style={{
            position: "absolute",
            height: "80px",
            width: "45px",
            backgroundColor: enableDragDebug ? "red" : "transparent",
            zIndex: 10,
            right: "40px",
            top: "2px",
            cursor: "help",
          }}
          onClick={openChat}
        ></div>
      </div>
      <img
        className="app-no-select"
        src={animation.src}
        draggable={false}
        alt="Clippy"
      />
    </div>
  );
}
