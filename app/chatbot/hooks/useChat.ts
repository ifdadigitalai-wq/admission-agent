"use client";

import { useState, useRef } from "react";

type Message = {
  role: "user" | "bot";
  content: string;
  image?: string; // Standardized to lowercase 'image' for consistency
};

type LeadInfo = {
  name?: string;
  email?: string;
  phone?: string;
  course?: string;
  collected?: boolean;
};

type Course = {
  id: string;
  name: string;
  description: string;
  image: string;
  link: string;
  duration: string;
  fee: string;
};

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
  const [suggestions, setSuggestions] = useState<string[]>([
    "📚 View Courses",
    "💰 Check Fees",
    "📋 Enroll Now",
    "📞 Schedule a Call",
  ]);
  const [showCourses, setShowCourses] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);

  const sessionId = useRef(getSessionId());

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
          sessionId: sessionId.current,
        }),
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();

      if (data.leadInfo) setLeadInfo(data.leadInfo);
      if (typeof data.isEnrolling === "boolean") setIsEnrolling(data.isEnrolling);
      if (typeof data.isScheduling === "boolean") setIsScheduling(data.isScheduling);
      if (data.schedulingStep !== undefined) setSchedulingStep(data.schedulingStep);
      if (data.scheduleData) setScheduleData(data.scheduleData);
      if (data.availableDates) setAvailableDates(data.availableDates);
      if (data.suggestions) setSuggestions(data.suggestions);
      if (typeof data.showCourses === "boolean") setShowCourses(data.showCourses);
      if (data.courses) setCourses(data.courses);

      const botMessage: Message = {
        role: "bot",
        content: data.reply || "I'm sorry, I couldn't process that.",
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: "I'm having trouble connecting. Please try again later." },
      ]);
    } finally {
      setLoading(false);
    }
  };

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
    setSuggestions(["📚 View Courses", "💰 Check Fees", "📋 Enroll Now", "📞 Schedule a Call"]);
    setShowCourses(false);
    setCourses([]);
  };

  return {
    messages,
    sendMessage,
    loading,
    leadInfo,
    isEnrolling,
    isScheduling,
    schedulingStep,
    scheduleData,
    resetSession,
    suggestions,
    showCourses,
    courses,
  };
}