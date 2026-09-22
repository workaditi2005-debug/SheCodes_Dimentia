import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useI18n } from "../i18n/LanguageContext";
import { listen, speak, speakChunked, stopSpeaking, playSelectSound } from "../utils/voice";
import { dispatchVoiceCommand, getActiveContext } from "../utils/voiceDispatcher";
import { submitChat } from "../services/api";

const VoiceAssistantContext = createContext(null);

function getSilenceHint(language, silenceCount) {
  const isHi = language.startsWith("hi");
  const isBn = language.startsWith("bn");

  if (silenceCount === 1) {
    return isHi
      ? "मैं यहाँ हूँ। जब भी तैयार हों, बोलिए।"
      : isBn
      ? "আমি এখানে আছি। যখন প্রস্তুত হবেন, বলুন।"
      : "I'm here whenever you're ready. Just speak.";
  }

  const ctx = getActiveContext();
  if (ctx && ctx.options && ctx.options.length > 0) {
    const optionNames = ctx.options
      .slice(0, 3)
      .map(o => o.label || o.title || o.id)
      .filter(Boolean)
      .join(", ");
    return isHi
      ? `आप "${optionNames}" जैसा कुछ कह सकते हैं। या कहें: "घर चलो" या "मेरी दवाइयाँ दिखाओ"।`
      : isBn
      ? `আপনি "${optionNames}" বলতে পারেন। বা বলুন: "হোম পেজ" বা "আমার ওষুধ দেখাও"।`
      : `You can say things like: "${optionNames}". Or try: "Go home" or "Open brain games".`;
  }

  return isHi
    ? "आप कह सकते हैं: \"खेल खोलें\", \"दवाइयाँ दिखाओ\", या \"घर चलो\"।"
    : isBn
    ? "আপনি বলতে পারেন: \"গেম খুলুন\", \"ওষুধ দেখাও\", বা \"হোম পেজে যাও\"।"
    : "You can say: \"Open brain games\", \"Show my medicines\", or \"Go home\".";
}

export function VoiceAssistantProvider({ children, setPage }) {
  const i18n = useI18n();
  const language = i18n?.language || "en-IN";
  const t = i18n?.t || ((k, d) => d);

  const [voiceAssistantEnabled, setVoiceAssistantEnabled] = useState(false);
  const [assistantState, setAssistantState] = useState("off"); // off | idle | listening | understanding | speaking
  const [statusText, setStatusText] = useState("");
  const [transcript, setTranscript] = useState("");
  const [lastSpokeText, setLastSpokeText] = useState("");
  const [error, setError] = useState(null);

  const activeRecRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const silenceCountRef = useRef(0);
  const enabledRef = useRef(false);

  useEffect(() => {
    enabledRef.current = voiceAssistantEnabled;
  }, [voiceAssistantEnabled]);

  const abortListening = useCallback(() => {
    if (activeRecRef.current) {
      try {
        activeRecRef.current.onresult = null;
        activeRecRef.current.onerror = null;
        activeRecRef.current.onend = null;
        activeRecRef.current.stop();
      } catch (e) {
        // Ignore stop errors
      }
      activeRecRef.current = null;
    }
  }, []);

  const speakResponse = useCallback((text, onEndCallback = null) => {
    if (!text) {
      onEndCallback?.();
      return;
    }

    abortListening();
    isSpeakingRef.current = true;
    setAssistantState("speaking");
    setLastSpokeText(text);
    setStatusText(text);

    speak(text, language, () => {
      isSpeakingRef.current = false;
      onEndCallback?.();
    });
  }, [language, abortListening]);

  const speakResponseChunked = useCallback((sentences, onEndCallback = null) => {
    if (!sentences || sentences.length === 0) {
      onEndCallback?.();
      return;
    }

    abortListening();
    isSpeakingRef.current = true;
    setAssistantState("speaking");
    const firstSentence = sentences[0] || "";
    setLastSpokeText(firstSentence);
    setStatusText(firstSentence);

    speakChunked(sentences, language, () => {
      isSpeakingRef.current = false;
      onEndCallback?.();
    });
  }, [language, abortListening]);

  // Command Processing (Voice or Text)
  const executeCommand = useCallback(async (userText) => {
    if (!enabledRef.current) return;
    silenceCountRef.current = 0;
    setTranscript(userText);
    setAssistantState("understanding");
    setStatusText(`Understanding: "${userText}"`);

    const result = dispatchVoiceCommand(userText, setPage, t);

    let replyText = "";
    if (result.handled) {
      replyText = result.speakText || result.label || "Done.";
    } else {
      // Conversational Fallback to AI Service / RAG
      try {
        const res = await submitChat(userText);
        if (res && res.answer) {
          replyText = res.answer;
        } else {
          replyText = result.suggestedFallback || "I didn't quite catch that. You can say: go home, open brain games, or show my medicines.";
        }
      } catch (err) {
        replyText = result.suggestedFallback || "I didn't quite catch that. You can say: go home, open brain games, or show my medicines.";
      }
    }

    speakResponse(replyText, () => {
      if (enabledRef.current) {
        setTimeout(() => startListeningWindow(), 400);
      } else {
        setAssistantState("off");
      }
    });
  }, [setPage, t, speakResponse]);

  // Main Listening Loop Window
  const startListeningWindow = useCallback(() => {
    if (!enabledRef.current || isSpeakingRef.current) return;

    abortListening();
    setError(null);
    setAssistantState("listening");
    setStatusText("Listening...");

    let hasReceivedFinal = false;

    const recognitionInstance = listen(
      language,
      // 1. On speech transcript recognized (text, isFinal)
      (userText, isFinal) => {
        if (!enabledRef.current || isSpeakingRef.current) return;

        if (isFinal) {
          hasReceivedFinal = true;
          abortListening();
          executeCommand(userText);
        } else {
          setStatusText(`Listening: "${userText}..."`);
        }
      },
      // 2. On speech recognition error
      (err) => {
        if (!enabledRef.current || isSpeakingRef.current) return;
        abortListening();

        if (err && err.type === "NO_SPEECH") {
          silenceCountRef.current += 1;

          if (silenceCountRef.current <= 3) {
            const hint = getSilenceHint(language, silenceCountRef.current);
            speakResponse(hint, () => {
              if (enabledRef.current) {
                setTimeout(() => startListeningWindow(), 400);
              }
            });
          } else {
            setAssistantState("idle");
            setStatusText(
              language.startsWith("hi")
                ? "🟢 वॉइस असिस्टेंट ऑन"
                : language.startsWith("bn")
                ? "🟢 ভয়েস সহকারী অন"
                : "🟢 Voice Assistant ON"
            );
            setTimeout(() => {
              if (enabledRef.current && !isSpeakingRef.current) {
                silenceCountRef.current = 0;
                startListeningWindow();
              }
            }, 10000);
          }
        } else if (err && err.type === "NOT_ALLOWED") {
          setError(err);
          const deniedMsg = "I can't access the microphone right now. You can continue using the buttons or type commands.";
          speakResponse(deniedMsg, () => setAssistantState("idle"));
        } else {
          setAssistantState("idle");
          setTimeout(() => {
            if (enabledRef.current && !isSpeakingRef.current) {
              startListeningWindow();
            }
          }, 800);
        }
      },
      // 3. On recognition ended cleanly
      (hasSpeech) => {
        if (!enabledRef.current || isSpeakingRef.current || hasReceivedFinal) return;

        // If recognition closed automatically without final result
        if (!hasSpeech) {
          silenceCountRef.current += 1;
          if (silenceCountRef.current <= 3) {
            const hint = getSilenceHint(language, silenceCountRef.current);
            speakResponse(hint, () => {
              if (enabledRef.current) {
                setTimeout(() => startListeningWindow(), 400);
              }
            });
          } else {
            setAssistantState("idle");
            setStatusText("🟢 Voice Assistant ON");
            setTimeout(() => {
              if (enabledRef.current && !isSpeakingRef.current) {
                silenceCountRef.current = 0;
                startListeningWindow();
              }
            }, 10000);
          }
        }
      }
    );

    activeRecRef.current = recognitionInstance;
  }, [language, abortListening, executeCommand, speakResponse]);

  const announcePageContext = useCallback((text, sentences = null) => {
    if (!enabledRef.current) return;

    setTimeout(() => {
      if (!enabledRef.current || isSpeakingRef.current) return;

      const done = () => {
        if (enabledRef.current) {
          setTimeout(() => startListeningWindow(), 400);
        }
      };

      if (sentences && sentences.length > 0) {
        speakResponseChunked(sentences, done);
      } else if (text) {
        speakResponse(text, done);
      }
    }, 700);
  }, [speakResponse, speakResponseChunked, startListeningWindow]);

  const enableVoiceAssistant = useCallback(() => {
    playSelectSound();
    setVoiceAssistantEnabled(true);
    enabledRef.current = true;
    silenceCountRef.current = 0;

    const greetingMsg = language.startsWith("hi")
      ? "मैं यहाँ हूँ! मैं आपकी क्या मदद कर सकता हूँ?"
      : language.startsWith("bn")
      ? "আমি আছি! আমি আপনাকে কীভাবে সাহায্য করতে পারি?"
      : "I'm here! How can I help you today?";

    speakResponse(greetingMsg, () => {
      if (enabledRef.current) {
        setTimeout(() => startListeningWindow(), 300);
      }
    });
  }, [language, speakResponse, startListeningWindow]);

  const disableVoiceAssistant = useCallback(() => {
    playSelectSound();
    setVoiceAssistantEnabled(false);
    enabledRef.current = false;
    isSpeakingRef.current = false;
    silenceCountRef.current = 0;

    abortListening();
    stopSpeaking();
    setAssistantState("off");
    setStatusText("");
    setTranscript("");
  }, [abortListening]);

  const toggleVoiceAssistant = useCallback(() => {
    if (voiceAssistantEnabled) {
      disableVoiceAssistant();
    } else {
      enableVoiceAssistant();
    }
  }, [voiceAssistantEnabled, enableVoiceAssistant, disableVoiceAssistant]);

  const processCommandText = useCallback((rawText) => {
    if (!rawText) return;
    if (!enabledRef.current) {
      setVoiceAssistantEnabled(true);
      enabledRef.current = true;
    }
    executeCommand(rawText);
  }, [executeCommand]);

  useEffect(() => {
    return () => {
      abortListening();
      stopSpeaking();
    };
  }, [abortListening]);

  const value = {
    voiceAssistantEnabled,
    assistantState,
    statusText,
    transcript,
    lastSpokeText,
    error,
    toggleVoiceAssistant,
    enableVoiceAssistant,
    disableVoiceAssistant,
    processCommandText,
    speakResponse,
    speakResponseChunked,
    announcePageContext,
    startListeningWindow,
  };

  return (
    <VoiceAssistantContext.Provider value={value}>
      {children}
    </VoiceAssistantContext.Provider>
  );
}

export function useVoiceAssistant() {
  const context = useContext(VoiceAssistantContext);
  if (!context) {
    throw new Error("useVoiceAssistant must be used within a VoiceAssistantProvider");
  }
  return context;
}
