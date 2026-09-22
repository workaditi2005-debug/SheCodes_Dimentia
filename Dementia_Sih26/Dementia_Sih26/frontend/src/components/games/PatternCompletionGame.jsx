import { useState, useEffect, useRef } from "react";
import GameShell from "./GameShell";
import { PATTERN_COMPLETION_PUZZLES } from "../../data/gameContent";
import { useI18n } from "../../i18n/LanguageContext";
import { playTapSound, playMatchSound, playGentleMissSound } from "../../utils/gameAudio";
import { submitGameSession, getGameRecommendation } from "../../services/api";

function getTotalPuzzles(lvl) {
  switch (lvl) {
    case 1: return 3; // Easy
    case 2: return 4; // Medium
    case 3: return 5; // Hard
    case 4: return 6; // Pro
    case 5: return 8; // Advance
    default: return 3;
  }
}

export default function PatternCompletionGame({ setPage }) {
  const { lang } = useI18n();
  const [level, setLevel] = useState(1);
  const totalRounds = getTotalPuzzles(level);

  const [currentRound, setCurrentRound] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [feedbackState, setFeedbackState] = useState(null); // "correct" | "wrong" | null
  const [moves, setMoves] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completionResult, setCompletionResult] = useState(null);

  const timerRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const lastActionTimeRef = useRef(Date.now());
  const latenciesRef = useRef([]);

  // Fetch adaptive recommended level on mount
  useEffect(() => {
    getGameRecommendation("pattern_completion")
      .then((res) => {
        if (res && res.recommended_level && [1, 2, 3, 4, 5].includes(res.recommended_level)) {
          setLevel(res.recommended_level);
        }
      })
      .catch(() => {});
  }, []);

  const puzzles = PATTERN_COMPLETION_PUZZLES.slice(0, totalRounds);
  const puzzle = puzzles[currentRound] || puzzles[0];

  function initLevel(lvl = level) {
    setCurrentRound(0);
    setSelectedIdx(null);
    setFeedbackState(null);
    setMoves(0);
    setMistakes(0);
    setTimer(0);
    setIsCompleted(false);
    setCompletionResult(null);
    startTimeRef.current = Date.now();
    lastActionTimeRef.current = Date.now();
    latenciesRef.current = [];

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer((t) => t + 1);
    }, 1000);
  }

  useEffect(() => {
    initLevel(level);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [level]);

  function handleOptionSelect(opt, idx) {
    if (feedbackState === "correct") return;

    playTapSound();
    const now = Date.now();
    const latency = Math.min(10, Math.max(0.2, (now - lastActionTimeRef.current) / 1000));
    latenciesRef.current.push(latency);
    lastActionTimeRef.current = now;

    setSelectedIdx(idx);
    setMoves((m) => m + 1);

    if (opt.correct) {
      playMatchSound();
      setFeedbackState("correct");

      setTimeout(() => {
        if (currentRound + 1 >= totalRounds) {
          handleWin(moves + 1, mistakes);
        } else {
          setCurrentRound((r) => r + 1);
          setSelectedIdx(null);
          setFeedbackState(null);
          lastActionTimeRef.current = Date.now();
        }
      }, 1000);
    } else {
      playGentleMissSound();
      setFeedbackState("wrong");
      setMistakes((mis) => mis + 1);

      setTimeout(() => {
        setSelectedIdx(null);
        setFeedbackState(null);
      }, 900);
    }
  }

  async function handleWin(finalMoves, finalMistakes) {
    if (timerRef.current) clearInterval(timerRef.current);
    const duration = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
    const totalActions = Math.max(1, finalMoves);
    const accuracy = Math.min(1.0, totalRounds / totalActions);
    const errorRate = Math.min(1.0, finalMistakes / totalActions);
    const avgResponseTime =
      latenciesRef.current.length > 0
        ? latenciesRef.current.reduce((a, b) => a + b, 0) / latenciesRef.current.length
        : duration / totalActions;

    try {
      const res = await submitGameSession({
        game_id: "pattern_completion",
        difficulty_level: level,
        duration_seconds: duration,
        moves_count: finalMoves,
        mistakes_count: finalMistakes,
        completed: true,
        accuracy: accuracy,
        response_time: avgResponseTime,
        error_rate: errorRate,
        completion_rate: 1.0,
        telemetry: {
          action_latencies: latenciesRef.current,
        },
      });
      setCompletionResult(res);
    } catch (e) {
      setCompletionResult({
        score: Math.max(50, 100 - finalMistakes * 10),
        stars: finalMistakes <= 1 ? 3 : finalMistakes <= 2 ? 2 : 1,
        duration_seconds: duration,
        feedback_message: "Superb fluid reasoning and pattern problem-solving!",
        cognitive_domain: "Executive Function & Patterns",
        adaptive_difficulty: {
          previous_level: level,
          new_level: finalMistakes <= 1 && level < 5 ? level + 1 : level,
          reason: ["accuracy above target", "stable response time"],
          adjustment: finalMistakes <= 1 && level < 5 ? "increase" : "maintain",
        },
      });
    }
    setIsCompleted(true);
  }

  return (
    <GameShell
      gameId="pattern_completion"
      title="Pattern Completion"
      domainLabel="Executive Function & Patterns"
      accentColor="#a78bfa"
      instructionText="Look at the repeating pattern and pick the piece that completes the sequence."
      difficultyLevel={level}
      onDifficultyChange={(lvl) => setLevel(lvl)}
      timerSeconds={timer}
      movesCount={moves}
      mistakesCount={mistakes}
      onRestart={() => initLevel(level)}
      onHint={() => {
        // Highlighting correct option
        const correctIdx = puzzle.options.findIndex((o) => o.correct);
        setSelectedIdx(correctIdx);
      }}
      onBack={() => setPage("games")}
      isCompleted={isCompleted}
      completionResult={completionResult}
      onPlayAgain={(nextLvl) => {
        if (nextLvl && [1, 2, 3, 4, 5].includes(nextLvl)) {
          setLevel(nextLvl);
        } else {
          initLevel(level);
        }
      }}
    >
      <div style={{ width: "100%", maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
        {/* Round Counter */}
        <div style={{ marginBottom: 18, color: "#5C7382", fontSize: 14, fontWeight: 700 }}>
          Puzzle {currentRound + 1} of {totalRounds}
        </div>

        {/* Prompt */}
        <h3 style={{ fontSize: 22, color: "#1C2F3A", fontWeight: 800, marginBottom: 24 }}>
          {puzzle.prompt[lang] || puzzle.prompt.en}
        </h3>

        {/* Sequence Row with Question Mark Slot */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 12,
            marginBottom: 36,
            flexWrap: "wrap",
          }}
        >
          {puzzle.sequence.map((item, idx) => {
            const isTarget = item === "?";

            return (
              <div
                key={idx}
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 20,
                  border: isTarget
                    ? "2.5px dashed #7C3AED"
                    : "1.5px solid rgba(28,58,68,0.14)",
                  background: isTarget
                    ? "rgba(124,58,237,0.08)"
                    : "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: isTarget ? 34 : 38,
                  fontWeight: isTarget ? 900 : 600,
                  color: isTarget ? "#7C3AED" : "#1C2F3A",
                  boxShadow: isTarget ? "0 0 16px rgba(124,58,237,0.2)" : "0 4px 14px rgba(28,47,58,0.05)",
                }}
              >
                {isTarget && selectedIdx !== null && feedbackState === "correct"
                  ? puzzle.options[selectedIdx].icon
                  : item}
              </div>
            );
          })}
        </div>

        {/* Option Selection Grid */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 16, color: "#5C7382", fontWeight: 700, marginBottom: 16 }}>
            Choose the matching piece:
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${puzzle.options.length}, 1fr)`,
              gap: 16,
              maxWidth: 480,
              margin: "0 auto",
            }}
          >
            {puzzle.options.map((opt, idx) => {
              const isSelected = selectedIdx === idx;
              const isCorrect = isSelected && feedbackState === "correct";
              const isWrong = isSelected && feedbackState === "wrong";
              const optLabel = opt.label[lang] || opt.label.en;

              return (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(opt, idx)}
                  disabled={feedbackState !== null}
                  style={{
                    padding: "20px 14px",
                    borderRadius: 20,
                    border: isCorrect
                      ? "2px solid #0F6B45"
                      : isWrong
                      ? "2px solid #991B1B"
                      : "1.5px solid rgba(28,58,68,0.14)",
                    background: isCorrect
                      ? "#DCFCE7"
                      : isWrong
                      ? "#FEE2E2"
                      : "#FFFFFF",
                    cursor: feedbackState === null ? "pointer" : "default",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 10,
                    transition: "all 0.15s ease",
                    boxShadow: isCorrect || isWrong
                      ? "none"
                      : "0 4px 14px rgba(28,47,58,0.05)",
                  }}
                >
                  <span style={{ fontSize: 46 }}>{opt.icon}</span>
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: isCorrect ? "#0F6B45" : isWrong ? "#991B1B" : "#1C2F3A",
                    }}
                  >
                    {optLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </GameShell>
  );
}
