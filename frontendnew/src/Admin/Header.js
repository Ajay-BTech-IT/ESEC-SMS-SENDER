import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const Header = ({ activeMenu, setActiveMenu }) => {
  const [openMenu, setOpenMenu] = useState(null); // Tracks which menu's dropdown is open
  const navigate = useNavigate(); // Hook for navigation

  // Function to handle dropdown clicks
  const handleMenuClick = (option) => {
    console.log(`${option} clicked`);
    setOpenMenu(null);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token'); // Remove token from localStorage
    navigate('/login'); // Redirect to Login page
  };

  return (
    <header className="bg-[#292966] text-white py-4 px-8">
      {/* Logo and College Name */}
      <div className="flex items-center justify-between md:flex-row flex-col md:space-x-4 space-y-2 md:space-y-0">
        {/* Logo and College Name */}
        <div className="flex items-center space-x-2">
          {/* Logo */}
          <img
            src={require('../assets/eseclogo.jpg')}
            alt="College Logo"
            className="w-10 h-10 rounded-full"
          />
          {/* College Name */}
          <div>
            <span className="text-lg font-bold">ERODE</span>
            <h1 className="text-lg font-bold mt-1">SENGUNTHAR ENGINEERING COLLEGE</h1>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex items-center">
          <ul className="flex space-x-6 md:space-x-6 sm:space-x-4 xs:space-x-2">
            {/* Home Menu */}
            <li>
              <button
                onClick={() => {
                  setActiveMenu('home');
                  setOpenMenu(null);
                }}
                className={`hover:text-gray-300 ${
                  activeMenu === 'home' ? 'border-b-2 border-white pb-1' : ''
                }`}
              >
                Home
              </button>
            </li>

            {/* Add Menu with Dropdown */}
            <li className="relative group">
              <button
                onClick={() => setOpenMenu(openMenu === 'add' ? null : 'add')}
                className={`hover:text-gray-300 ${
                  activeMenu.startsWith('add') ? 'border-b-2 border-white pb-1' : ''
                }`}
              >
                Add
              </button>
              {/* Dropdown Menu */}
              <ul
                className={`absolute bg-white text-blue-600 shadow-md rounded-md mt-2 ${
                  openMenu === 'add' ? 'block' : 'hidden'
                } z-10 transition-all duration-300 ease-in-out transform-gpu`}
                style={{ left: 'auto', right: '0' }}
                onMouseEnter={() => setOpenMenu('add')}
                onMouseLeave={() => setOpenMenu(null)}
              >
                <li
                  className="hover:bg-blue-100 px-4 py-2 cursor-pointer"
                  onClick={() => {
                    handleMenuClick("Add Student");
                    setActiveMenu('add-student');
                  }}
                >
                  Add Student
                </li>
                <li
                  className="hover:bg-blue-100 px-4 py-2 cursor-pointer"
                  onClick={() => {
                    handleMenuClick("Add Advisor");
                    setActiveMenu('add-advisor');
                  }}
                >
                  Add Advisor
                </li>
                <li
                  className="hover:bg-blue-100 px-4 py-2 cursor-pointer"
                  onClick={() => {
                    handleMenuClick("Add Admin");
                    setActiveMenu('add-admin');
                  }}
                >
                  Add Admin
                </li>
              </ul>
            </li>

            {/* Update Menu with Dropdown */}
            <li className="relative group">
              <button
                onClick={() => setOpenMenu(openMenu === 'update' ? null : 'update')}
                className={`hover:text-gray-300 ${
                  activeMenu.startsWith('update') ? 'border-b-2 border-white pb-1' : ''
                }`}
              >
                Update
              </button>
              {/* Dropdown Menu */}
              <ul
                className={`absolute bg-white text-blue-600 shadow-md rounded-md mt-2 ${
                  openMenu === 'update' ? 'block' : 'hidden'
                } z-10 transition-all duration-300 ease-in-out transform-gpu`}
                style={{ left: 'auto', right: '0' }}
                onMouseEnter={() => setOpenMenu('update')}
                onMouseLeave={() => setOpenMenu(null)}
              >
                <li
                  className="hover:bg-blue-100 px-4 py-2 cursor-pointer"
                  onClick={() => {
                    handleMenuClick("Update Student");
                    setActiveMenu('update-student');
                  }}
                >
                  Update Student
                </li>
                <li
                  className="hover:bg-blue-100 px-4 py-2 cursor-pointer"
                  onClick={() => {
                    handleMenuClick("Update Advisor");
                    setActiveMenu('update-advisor');
                  }}
                >
                  Update Advisor
                </li>
                <li
                  className="hover:bg-blue-100 px-4 py-2 cursor-pointer"
                  onClick={() => {
                    handleMenuClick("Update Admin");
                    setActiveMenu('update-admin');
                  }}
                >
                  Update Admin
                </li>
              </ul>
            </li>

            {/* Remove Menu with Dropdown */}
            <li className="relative group">
              <button
                onClick={() => setOpenMenu(openMenu === 'remove' ? null : 'remove')}
                className={`hover:text-gray-300 ${
                  activeMenu.startsWith('remove') ? 'border-b-2 border-white pb-1' : ''
                }`}
              >
                Remove
              </button>
              {/* Dropdown Menu */}
              <ul
                className={`absolute bg-white text-blue-600 shadow-md rounded-md mt-2 ${
                  openMenu === 'remove' ? 'block' : 'hidden'
                } z-10 transition-all duration-300 ease-in-out transform-gpu`}
                style={{ left: 'auto', right: '0' }}
                onMouseEnter={() => setOpenMenu('remove')}
                onMouseLeave={() => setOpenMenu(null)}
              >
                <li
                  className="hover:bg-blue-100 px-4 py-2 cursor-pointer"
                  onClick={() => {
                    handleMenuClick("Remove Student");
                    setActiveMenu('remove-student');
                  }}
                >
                  Remove Student
                </li>
                <li
                  className="hover:bg-blue-100 px-4 py-2 cursor-pointer"
                  onClick={() => {
                    handleMenuClick("Remove Advisor");
                    setActiveMenu('remove-advisor');
                  }}
                >
                  Remove Advisor
                </li>
                <li
                  className="hover:bg-blue-100 px-4 py-2 cursor-pointer"
                  onClick={() => {
                    handleMenuClick("Remove Admin");
                    setActiveMenu('remove-admin');
                  }}
                >
                  Remove Admin
                </li>
              </ul>
            </li>

            {/* Logout Button */}
            <li>
              <button
                onClick={handleLogout}
                className="hover:text-gray-300"
              >
                Logout
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;