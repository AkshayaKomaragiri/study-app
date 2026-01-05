import React from 'react'
import Link from 'next/link';
//import {useState} from 'react'


interface NavbarProps {
    name: string;
    flashcardsButton: string;
    viewSets: string;
    quizButton: string;
    history: string
}

function Navbar({ name,  viewSets, quizButton, history }: NavbarProps) {
  return (
    <nav className="navbar flex items-center bg-slate-900 gap-4 rounded-lg pl-10 bg-black shadow-md outline outline-black/5 ">
      <div className="navbar-brand text-5xl pt-8 pr-8 pd-8 pl-6 pb-10">
        <span>{name}</span>

        <button className="w-32 outline-double border-white text-lg ml-25 text-white bg-black hover:bg-white hover: border-black hover:text-black py-2 px-4 rounded-full"><Link href="/">Home</Link></button>
        {/* <button className="w-32 outline-double border-white text-lg ml-25 text-white bg-black hover:bg-white hover: border-black hover:text-black py-2 px-4 rounded-full"><Link href="/flashcards">{flashcardsButton}</Link></button>*/}
        <button className="w-32 outline-double border-white text-lg ml-25 text-white bg-black hover:bg-white hover:text-black py-2 px-4 rounded-full"><Link href="/sets">{viewSets}</Link></button>
        <button className="w-32 outline-double border-white text-lg ml-25 text-white bg-black hover:bg-white hover:text-black py-2 px-4 rounded-full"><Link href="/quiz">{quizButton}</Link></button>
        <button className="w-32 outline-double border-white text-lg ml-25 text-white bg-black hover:bg-white hover:text-black py-2 px-4 rounded-full">{history}</button>

      </div>
    </nav>
  )
}

export default Navbar