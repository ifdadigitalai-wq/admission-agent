"use client";

import { useState } from "react";

type Message = {
  role: "user" | "bot";
  content: string;
};

type LeadInfo = {
  name?: string;
  email?: string;
  phone?: string;
  course?: string;
  collected?: boolean;
};

export default function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [leadInfo, setLeadInfo] = useState<LeadInfo>({});
  const [isEnrolling, setIsEnrolling] = useState(false);

  // ✅ Scheduling states
  const [isScheduling, setIsScheduling] = useState(false);
  const [schedulingStep, setSchedulingStep] = useState<string | null>(null);
  const [scheduleData, setScheduleData] = useState<any>({});
  const [availableDates, setAvailableDates] = useState<string[]>([]);

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
          isScheduling,     // ✅
          schedulingStep,   // ✅
          scheduleData,     // ✅
          availableDates,   // ✅
        }),
      });

      const data = await res.json();

      // Update lead info
      if (data.leadInfo) setLeadInfo(data.leadInfo);
      if (typeof data.isEnrolling === "boolean") setIsEnrolling(data.isEnrolling);

      // ✅ Update scheduling states from response
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

  return {
    messages,
    sendMessage,
    loading,
    leadInfo,
    isEnrolling,
    isScheduling,   // ✅
    schedulingStep, // ✅
    scheduleData,   // ✅
  };
}