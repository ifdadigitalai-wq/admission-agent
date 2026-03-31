"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";

type Message = { role: "user" | "bot"; content: string };
type LeadInfo = {
  name?: string; email?: string; phone?: string;
  course?: string; collected?: boolean;
};

// ✅ Generate a unique session ID per browser tab
function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem("chat_session_id");
  if (!id) {
    id = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem("chat_session_id", id);
  }
  return id;
}

export default function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [leadInfo, setLeadInfo] = useState<LeadInfo>({});
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [schedulingStep, setSchedulingStep] = useState<string | null>(null);
  const [scheduleData, setScheduleData] = useState<any>({});
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const sessionId = useRef(getSessionId()); // ✅ stable across renders

  const sendMessage = async (input: string) => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          leadInfo,
          isEnrolling,
          isScheduling,
          schedulingStep,
          scheduleData,
          availableDates,
          sessionId: sessionId.current, // ✅ send session ID
        }),
      });

      const data = await res.json();

      if (data.leadInfo) setLeadInfo(data.leadInfo);
      if (typeof data.isEnrolling === "boolean") setIsEnrolling(data.isEnrolling);
      if (typeof data.isScheduling === "boolean") setIsScheduling(data.isScheduling);
      if (data.schedulingStep !== undefined) setSchedulingStep(data.schedulingStep);
      if (data.scheduleData) setScheduleData(data.scheduleData);
      if (data.availableDates) setAvailableDates(data.availableDates);

      const botMessage: Message = {
        role: "bot",
        content: data.reply || "Something went wrong.",
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Reset session on new chat
  const resetSession = () => {
    const newId = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem("chat_session_id", newId);
    sessionId.current = newId;
    setMessages([]);
    setLeadInfo({});
    setIsEnrolling(false);
    setIsScheduling(false);
    setSchedulingStep(null);
    setScheduleData({});
    setAvailableDates([]);
  };

  return {
    messages, sendMessage, loading, leadInfo,
    isEnrolling, isScheduling, schedulingStep,
    scheduleData, resetSession,
  };
}