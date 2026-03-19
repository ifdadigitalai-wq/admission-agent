"use client";

import { useState } from "react";

type Message = {
  role: "user" | "bot";
  content: string;
};

export default function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (input: string) => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();

      const botMessage: Message = {
        role: "bot",
        content: data.reply,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return { messages, sendMessage, loading };
}