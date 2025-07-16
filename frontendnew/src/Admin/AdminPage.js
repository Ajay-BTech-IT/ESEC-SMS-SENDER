import React, { useState, useEffect, useRef } from 'react';
import Header from './Header';
import AddMenu from './AddMenu';
import UpdateMenu from './UpdateMenu';
import RemoveMenu from './RemoveMenu'; // ✅ Import RemoveMenu

const AdminPage = ({ isLoggedIn }) => {
  const [activeMenu, setActiveMenu] = useState(() => {
    return isLoggedIn ? 'home' : localStorage.getItem('activeMenu') || 'home';
  });

  useEffect(() => {
    if (!isLoggedIn) {
      setActiveMenu('home');
    }
  }, [isLoggedIn]);

  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
      }
    };

    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    return () => window.removeEventListener('resize', updateHeaderHeight);
  }, []);

  return (
    <div className="font-sans min-h-screen flex flex-col bg-gray-50">
      {/* Fixed Header */}
      <div ref={headerRef} className="fixed top-0 left-0 w-full z-50 bg-white shadow-md">
        <Header activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      </div>

      {/* Main Content */}
      <main
        className="flex-grow bg-white p-6 md:p-8"
        style={{ marginTop: `${headerHeight}px` }}
      >
        {/* Home Page */}
        {activeMenu === 'home' && (
          <div className="flex flex-col md:flex-row items-center justify-center md:justify-between p-6 bg-blue-100 rounded-lg shadow-lg space-y-6 md:space-y-0 md:space-x-6">
            {/* Left Side: Image */}
            <div className="w-full md:w-auto shadow-xl">
              <img
                src={require('../assets/man1.png')}
                alt="Admin Dashboard"
                className="w-full h-auto rounded-lg shadow-md md:w-96 md:h-96 object-cover"
              />
            </div>

            {/* Right Side: Welcome Message & Quote */}
            <div className="w-full md:w-auto text-center md:text-left">
              <h2 className="text-4xl font-bold text-gray-800">Welcome!</h2>
              <p className="mt-4 text-lg text-gray-700 italic">
                "Education is the most powerful weapon which you can use to change the world."
                <br />
                <span className="font-semibold">– Nelson Mandela</span>
              </p>
            </div>
          </div>
        )}

        {/* Add Menu */}
        {activeMenu.startsWith('add') && (
          <AddMenu selectedOption={activeMenu} setActiveMenu={setActiveMenu} />
        )}

        {/* Update Menu */}
        {activeMenu.startsWith('update') && (
          <UpdateMenu selectedOption={activeMenu} setActiveMenu={setActiveMenu} />
        )}

        {/* Remove Menu */}
        {activeMenu.startsWith('remove') && (
          <RemoveMenu selectedOption={activeMenu} setActiveMenu={setActiveMenu} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#292966] text-center text-sm text-white py-4">
        <p>© {new Date().getFullYear()} Erode Sengunthar Engineering College. All rights reserved.</p>
        <p>
          Developed by <span className="font-semibold">Ajay M -B.TECH-IT</span>
        </p>
      </footer>
    </div>
  );
};

export default AdminPage;
