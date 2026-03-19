"use client";

import useChat from "@/app/chatbot/hooks/useChat";
import ChatWindow from "@/app/chatbot/components/ChatWindow";
import InputBox from "@/app/chatbot/components/InputBox";

export default function ChatPage() {
  const { messages, sendMessage, loading } = useChat();

  return (
    <div className="flex flex-col h-screen">
      <ChatWindow messages={messages} />
      <InputBox onSend={sendMessage} loading={loading} />
    </div>
  );
}