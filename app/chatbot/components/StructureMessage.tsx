"use client";
import { useRef } from "react";
import { StructuredResponse, CourseCard } from "@/lib/ai/llm";

type Props = {
  structured: StructuredResponse;
  onQuickReply: (text: string) => void;
  loading: boolean;
  isLast: boolean;
};

const SUGGESTION_MAP: Record<string, string> = {
  "📋 Enroll Now": "I want to enroll in a course",
  "📞 Schedule a Call": "I want to schedule a call",
  "🏫 Visit Campus": "I want to visit the campus",
  "🔙 Main Menu": "Show me the main menu",
  "🔍 Similar Courses": "Show me similar courses",
  "📞 Talk to Counselor": "I want to talk to a counselor",
  "📚 View Courses": "Show me all available courses",
};

function CourseCarouselCard({
  item,
  onSelect,
}: {
  item: CourseCard;
  onSelect: (name: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(item.name)}
      style={{
        flexShrink: 0,
        width: "160px",
        background: "white",
        border: "1.5px solid #e2e8f0",
        borderRadius: "14px",
        padding: "14px 12px",
        textAlign: "left",
        cursor: "pointer",
        transition: "all .18s",
        boxShadow: "0 1px 4px rgba(0,0,0,.06)",
        scrollSnapAlign: "start",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "#3b82f6";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(37,99,235,.15)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(0,0,0,.06)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
    >
      {item.tag && (
        <span style={{
          fontSize: "10px", fontWeight: 700,
          background: "#dbeafe", color: "#1d4ed8",
          padding: "2px 8px", borderRadius: "20px",
          display: "inline-block", marginBottom: "8px",
        }}>
          {item.tag}
        </span>
      )}
      {item.category && (
        <div style={{ fontSize: "10px", color: "#94a3b8", marginBottom: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px" }}>
          {item.category}
        </div>
      )}
      <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#1e293b", lineHeight: 1.4, marginBottom: "8px" }}>
        {item.name}
      </div>
      <div style={{ fontSize: "13px", fontWeight: 800, color: "#2563eb" }}>
        {item.fee}
      </div>
      <div style={{
        marginTop: "10px", fontSize: "11px", fontWeight: 600,
        color: "#2563eb", background: "#eff6ff",
        borderRadius: "8px", padding: "5px 8px", textAlign: "center",
      }}>
        Know More →
      </div>
    </button>
  );
}

function CourseCarousel({ items, onSelect }: { items: CourseCard[]; onSelect: (name: string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === "right" ? 180 : -180, behavior: "smooth" });
    }
  };

  return (
    <div style={{ position: "relative", maxWidth: "300px", padding: "0 14px" }}>
      {/* Left arrow */}
      <button
        onClick={() => scroll("left")}
        style={{
          position: "absolute", left: "-4px", top: "50%", transform: "translateY(-60%)",
          zIndex: 10, width: "26px", height: "26px", borderRadius: "50%",
          background: "white", border: "1.5px solid #e2e8f0",
          boxShadow: "0 2px 8px rgba(0,0,0,.12)",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "16px", color: "#1e293b", lineHeight: 1,
        }}
      >‹</button>

      {/* Scrollable cards */}
      <div
        ref={scrollRef}
        style={{
          display: "flex", gap: "10px",
          overflowX: "auto", paddingBottom: "8px",
          scrollbarWidth: "none",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {items.map((item) => (
          <CourseCarouselCard key={item.id} item={item} onSelect={onSelect} />
        ))}
      </div>

      {/* Right arrow */}
      <button
        onClick={() => scroll("right")}
        style={{
          position: "absolute", right: "-4px", top: "50%", transform: "translateY(-60%)",
          zIndex: 10, width: "26px", height: "26px", borderRadius: "50%",
          background: "white", border: "1.5px solid #e2e8f0",
          boxShadow: "0 2px 8px rgba(0,0,0,.12)",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "16px", color: "#1e293b", lineHeight: 1,
        }}
      >›</button>
    </div>
  );
}

function CourseDetailCard({ course }: { course: any }) {
  return (
    <div style={{
      background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
      border: "1.5px solid #bfdbfe",
      borderRadius: "14px", padding: "14px",
      maxWidth: "260px",
    }}>
      <div style={{ fontSize: "14px", fontWeight: 800, color: "#1e293b", marginBottom: "6px" }}>
        {course.name}
      </div>
      {course.description && (
        <div style={{ fontSize: "12px", color: "#475569", marginBottom: "10px", lineHeight: 1.5 }}>
          {course.description}
        </div>
      )}
      <div style={{ display: "flex", gap: "16px" }}>
        <div>
          <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Fee</div>
          <div style={{ fontSize: "15px", fontWeight: 800, color: "#2563eb" }}>{course.fee}</div>
        </div>
        {course.duration && (
          <div>
            <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Duration</div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>{course.duration}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StructuredMessage({ structured, onQuickReply, loading, isLast }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {structured.components.map((component, i) => {
        if (component.type === "text") {
          return (
            <div key={i} className="ifda-bubble-msg bot" style={{ maxWidth: "280px" }}>
              {component.content}
            </div>
          );
        }

        if (component.type === "carousel") {
          return (
            <CourseCarousel
              key={i}
              items={component.items}
              onSelect={(name) => onQuickReply(`Tell me about the ${name} course`)}
            />
          );
        }

        if (component.type === "course_detail") {
          return <CourseDetailCard key={i} course={component.course} />;
        }

        if (component.type === "quick_replies") {
          if (!isLast) return null;
          return (
            <div key={i} className="ifda-qr">
              {component.options.map((option) => (
                <button
                  key={option}
                  className="ifda-qr-btn"
                  disabled={loading}
                  onClick={() => onQuickReply(SUGGESTION_MAP[option] || option)}
                >
                  {option}
                </button>
              ))}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}