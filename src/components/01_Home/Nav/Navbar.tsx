import React from 'react';

const Navbar = () => {
    return (
        <div className="flex items-center justify-between">
            <div className="flex justify-between">
                <div className="flex justify-between">
                    <div className="flex items-center"><span className="text-7xl">Logo</span></div>
                </div>
            </div>
            <div className="flex justify-between">
                <div className="flex justify-between">
                    <div className="flex items-center"><span className="font-bold">Home</span></div>
                    <div className="flex items-center"><span className="font-bold">Gameweek Live</span></div>
                    <div className="flex items-center"><span className="font-bold">Price Change</span></div>
                    <div className="flex items-center"><span className="font-bold">Scout</span></div>
                </div>
            </div>
            <div className="flex items-center">
                <span className="text-2xl">Login</span>
                <span className="font-bold">Day/Night</span>
            </div>
        </div>
    );
};

export default Navbar;