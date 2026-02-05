import { Outlet } from 'react-router-dom';
// import { Vote } from 'lucide-react';

export default function VoterLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-primary text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center md:space-x-4 ">
            {/* <Vote className="hidden md:block md:w-12 md:h-12" /> */}
            <img src="/asacs-icon.jpg" alt="all saints anglican church logo"  className='md:h-16 md:w-18 h-10 w-10 rounded-full'/>
            <h1 className="lg:text-3xl text-xl lg:text-left text-center font-display font-bold">
              All Saint's Anglican Church Voting System
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-8 pb-24">
        <Outlet />
      </main>

      <footer className="bg-gray-800 text-white py-6 mt-12 fixed bottom-0 w-full">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">© 2026 Secure Voting System. All rights reserved.</p>
          <p className="text-xs text-gray-400 mt-2">Your vote is private and secure.</p>
        </div>
      </footer>
    </div>
  );
}