type Message = {
  role: "user" | "bot";
  content: string;
};

export default function ChatWindow({ messages }: { messages: Message[] }) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`p-3 rounded-lg max-w-xs ${
            msg.role === "user"
              ? "bg-blue-500 text-white ml-auto"
              : "bg-gray-200 text-black"
          }`}
        >
          {msg.content}
        </div>
      ))}
    </div>
  );
}