const Navbar = () => {
  return (
    <nav className="bg-slate-800 text-white ">
      <div className="flex justify-around px-4 py-5 h-14 items-center mycontainer md:gap-[30vw]">
        <div className="logo font-bold text-2xl">
          <span className="text-green-700">&lt;</span>
          PASS
          <span className="text-green-700">OP&gt;</span>
        </div>
        {/* <ul>
          <li className="flex gap-4">
            <a className="hover:font-bold" href="/">Home</a>
            <a className="hover:font-bold" href="#">About</a>
            <a className="hover:font-bold" href="#">Contact</a>
          </li>
        </ul> */}
        <a
          className="flex items-center justify-center rounded-full bg-green-500 text-white"
          href="https://github.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img className="w-12 invert p-2" src="/icons/github.svg" alt="GitHub logo" />
          <span className="p-2 text-lg font-bold">GitHub</span>
        </a>
      </div>
    </nav>
  );
};

export default Navbar;
