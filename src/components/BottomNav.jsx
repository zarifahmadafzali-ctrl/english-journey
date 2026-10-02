import React from "react";
import { Home, BookOpen, Brain, BarChart3, HelpCircle } from "lucide-react";

const items = [
  { id: "home", label: "Home", icon: Home },
  { id: "learn", label: "Learn", icon: BookOpen },
  { id: "review", label: "Review", icon: Brain },
  { id: "quiz", label: "Quiz", icon: HelpCircle },
  { id: "progress", label: "Progress", icon: BarChart3 }
];

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="bottom-nav" role="navigation">
      {items.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          className={active === id ? "nav-item active" : "nav-item"}
          onClick={() => onChange(id)}
          aria-label={label}
        >
          <Icon size={22} strokeWidth={active === id ? 2.4 : 1.8} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
