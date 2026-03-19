"use client";

import { useState } from "react";

export default function InputBox({
  onSend,
  loading,
}: {
  onSend: (msg: string) => void;
  loading: boolean;
}) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    onSend(input);
    setInput("");
  };

  return (
    <div className="p-4 flex gap-2 border-t">
      <input
        className="flex-1 border p-2 rounded"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask something..."
      />
      <button
        onClick={handleSend}
        disabled={loading}
        className="bg-blue-500 text-white px-4 rounded"
      >
        Send
      </button>
    </div>
  );
}