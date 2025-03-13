import React from "react";

const Footer = () => {
  return (
    <div className="bg-slate-800 text-white flex flex-col justify-center items-center w-full fixed bottom-0 left-0 py-4">
      <div className="logo font-bold text-white text-2xl">
        <span className="text-green-700">&lt;</span>
        Pass
        <span className="text-green-700">OP/&gt;</span>
      </div>
      <div className="flex justify-center items-center text-sm">
        Created with <img className="w-5 m-2" src="/icons/heart.png" alt="heart" /> by
        <span className="ml-1">Divyesh</span>
      </div>
    </div>
  );
};

export default Footer;
