"use client";
import React, { useState } from 'react';

interface FlashCardProps{
  prompt: string;
  answer: string;
}
export default function Flashcard({prompt, answer }: FlashCardProps) {
  const [flipped, setFlipped] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setFlipped(f => !f);
    }
  };

  return (
    <div className="flex flex-col w-150 h-96 rounded-lg justify-center items-center [perspective:1000px]">
      <div
        role="button"
        tabIndex={0}
        aria-pressed={flipped}
        onClick={() => setFlipped(f => !f)}
        onKeyDown={handleKeyDown}
        className={`relative w-full h-full transition-transform duration-500 rounded-lg shadow-lg bg-slate-200 [transform-style:preserve-3d] cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400`}
        style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
      >
        {/*card content on front side*/}
        <div className="absolute text-2xl inset-0 flex items-center justify-center px-6 text-black text-center [backface-visibility:hidden]">{prompt}</div>
        {/*card content on back side*/}
        <div className="absolute inset-0 rounded-lg shadow-lg bg-slate-200 [transform:rotateY(180deg)] [backface-visibility:hidden] text-2xl text-black flex items-center justify-center px-6 text-center">
          <p className="m-0">{answer}</p>
        </div>
      </div>
    </div>
  );
}