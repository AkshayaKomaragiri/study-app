"use client"
import React from 'react'
import Link from 'next/link';
import {useState, useEffect} from 'react'
//import { useRouter } from 'next/navigation';

interface User{
  name: string;
  email: string;
}


function Navbar() {
 // const router = useRouter();
  const [user, setUser] = useState<User>()
 const getAuthenticatedUser = () => {
  if (typeof window === "undefined") return null;
  
  const data = localStorage.getItem("jwt");
  if (!data) return null;

  try {
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
}; 

useEffect(() => {

const checkUser = () => {
    const authData = getAuthenticatedUser();
    setUser(authData);
  };

  checkUser();
  window.addEventListener('user-login', checkUser);
  return () => {
    window.removeEventListener('storage', checkUser);
    window.removeEventListener('user-login', checkUser);
  };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("jwt");
    setUser(null);
    window.location.href = "/login";
    
  };

  return (
<nav className="fixed top-0 left-0 z-20 w-full h-16 bg-neutral-primary border-b border-default">
  <div className="h-full flex items-center justify-between px-4">
    <Link href="/" className="flex items-center">
      <span className="text-xl text-heading font-semibold whitespace-nowrap">Study Forge</span>
    </Link>

    <div className="hidden md:flex md:flex-1 md:justify-center" id="navbar-cta">
      <ul className="font-medium flex items-center space-x-6">
        <li>
          <Link href="/" className="block py-2 px-3 text-white bg-brand rounded md:bg-transparent md:text-fg-brand md:p-0" aria-current="page">Home</Link>
        </li>
        <li>
          <Link href="/classes" className="block py-2 px-3 text-heading rounded hover:bg-neutral-tertiary md:hover:bg-transparent md:border-0 md:hover:text-fg-brand md:p-0">Classes</Link>
        </li>
        <li>
          <Link href="/quiz" className="block py-2 px-3 text-heading rounded hover:bg-neutral-tertiary md:hover:bg-transparent md:border-0 md:hover:text-fg-brand md:p-0">Learn</Link>
        </li>
      </ul>
    </div>

    <div className="inline-flex items-center md:order-3">
      {user ? (
        <>
          <span className="text-sm font-medium mr-4">Hello, {user.name}</span>
          <button onClick={handleLogout} className="bg-transparent hover:bg-indigo-800 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded">Signout</button>
          
        </>
      ) : (
          <Link href="/login"><button className="bg-transparent hover:bg-indigo-800 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded">Login</button></Link>

      )}
      
      <button data-collapse-toggle="navbar-cta" type="button" className="inline-flex items-center p-2 w-9 h-9 justify-center text-sm text-body rounded-base md:hidden hover:bg-neutral-secondary-soft hover:text-heading focus:outline-none focus:ring-2 focus:ring-neutral-tertiary" aria-controls="navbar-cta" aria-expanded="false">
        <span className="sr-only">Open main menu</span>
      </button>
    </div>
  </div>
</nav>

  )
}

export default Navbar