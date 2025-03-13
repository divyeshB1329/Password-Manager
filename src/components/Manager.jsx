import React, { useEffect, useRef, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";

const Manager = () => {
  const ref = useRef();
  const passwordRef = useRef();
  const [form, setForm] = useState({ site: "", username: "", password: "" });
  const [passwordArray, setPasswordArray] = useState([]);

  const getPasswords = async () => {
    let req = await fetch("http://localhost:5000/");
    let passwords = await req.json();
    setPasswordArray(passwords);
  };

  useEffect(() => {
    getPasswords();
  }, []);

  const copyText = (text) => {
    toast("Copied to clipboard!", {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "dark",
    });
    navigator.clipboard.writeText(text);
  };

  const showPassword = () => {
    passwordRef.current.type = "text";
    if (ref.current.src.includes("/icons/hidden.png")) {
      ref.current.src = "/icons/eye.png";
      passwordRef.current.type = "text";
    } else {
      ref.current.src = "/icons/hidden.png";
      passwordRef.current.type = "password";
    }
  };

  const savePassword = async () => {
    if (
      form.site.length > 3 &&
      form.username.length > 3 &&
      form.password.length > 3
    ) {
      let existingIndex = passwordArray.findIndex(
        (item) => item._id === form._id
      );

      if (existingIndex !== -1) {
        // Update existing password in state
        const updatedArray = [...passwordArray];
        updatedArray[existingIndex] = { ...form };
        setPasswordArray(updatedArray);

        // Send PUT request to backend for updating in MongoDB
        await fetch(`http://localhost:5000/${form._id}`, {
          method: "PUT",
          headers: { "Content-type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        // Add new password
        const newPassword = { ...form };
        setPasswordArray([...passwordArray, newPassword]);

        await fetch("http://localhost:5000/", {
          method: "POST",
          headers: { "Content-type": "application/json" },
          body: JSON.stringify(newPassword),
        });
      }

      // Reset form after save/update
      setForm({ site: "", username: "", password: "" });

      toast.success("Password saved successfully!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    } else {
      toast.error("Error: Password not saved!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    }
  };

  const deletePassword = async (id) => {
    let c = confirm("Do you really want to delete this password?");
    if (c) {
      setPasswordArray(passwordArray.filter((item) => item.id !== id));
      let res = await fetch("http://localhost:5000/", {
        method: "DELETE",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({ id }),
      });

      toast("Password Deleted!", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    }
  };
  const editPassword = (id) => {
    setForm({ ...passwordArray.filter((i) => i.id === id)[0], id: id });
    setPasswordArray(passwordArray.filter((item) => item.id !== id));
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <div className="absolute inset-0 -z-10 h-full w-full bg-green-50 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-green-400 opacity-20 blur-[100px]"></div>
      </div>
      <div className="p-3 md:mycontainer min-h-[80.2vh] md:mx-[20%]">
        <h1 className="text-4xl font-bold text-center">
          <span className="text-green-700">&lt;</span>
          Pass
          <span className="text-green-700">OP/&gt;</span>
        </h1>
        <p className="text-green-900 text-lg text-center">
          Your own Password Manager
        </p>
        <div className="flex flex-col p-4 text-black gap-8 items-center">
          <input
            value={form.site}
            onChange={handleChange}
            className="rounded-full border border-green-500 w-full p-4 py-1"
            placeholder="Enter website URL"
            name="site"
            id="site"
            type="text"
          />
          <div className="flex flex-col md:flex-row w-full justify-between gap-8 ">
            <input
              value={form.username}
              onChange={handleChange}
              className="rounded-full border border-green-500 w-full p-4 py-1"
              placeholder="Enter Username"
              type="text"
              name="username"
              id="username"
            />
            <div className="relative md:w-76 rounded-full border border-green-500 flex">
              <input
                ref={passwordRef}
                value={form.password}
                onChange={handleChange}
                className=" md:w-45 w-full p-4 py-1 md:pr-0 pr-10 outline-none"
                placeholder="Enter Password"
                type="password"
                name="password"
                id="password"
              />
              <span className="absolute right-[8px] top-[7px] cursor-pointer">
                <img
                  className="p-0 pl-2"
                  ref={ref}
                  onClick={showPassword}
                  width={30}
                  src="/icons/hidden.png"
                  alt="eye"
                />
              </span>
            </div>
          </div>

          <button
            onClick={savePassword}
            className="flex justify-center items-center bg-green-500 hover:bg-green-400 rounded-full px-8 py-2 w-fit gap-3 border border-green-900"
          >
            <lord-icon
              src="https://cdn.lordicon.com/jgnvfzqg.json"
              trigger="hover"
            ></lord-icon>
            Save
          </button>
        </div>
        <div className="passwords">
          <h2 className="font-bold text-2xl py-4">Your Passwords</h2>
          {passwordArray.length === 0 && <div>No passwords to show</div>}
          {passwordArray.length != 0 && (
            <table
              border={2}
              className=" w-full rounded-md overflow-hidden md:mb-30 mb-30 table-fixed"
            >
              <thead className="bg-green-800 text-white">
                <tr>
                  <th className="py-3 px-4 text-left w-[25%]">Site</th>
                  <th className="py-3 px-4 text-left w-[25%]">Username</th>
                  <th className="py-3 px-4 text-left w-[25%]">Password</th>
                  <th className="py-3 px-4 text-left w-[25%]">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-green-100">
                {passwordArray.map((item, index) => (
                  <tr key={index} className="border-b border-green-300">
                    <td className="py-3 px-4 break-words min-w-[100px] border-r-2 border-green-800">
                      <div className="flex items-center justify-between gap-2">
                        <a
                          href={item.site}
                          target="_blank"
                          className="break-words truncate"
                        >
                          {item.site}
                        </a>
                        <div
                          className="cursor-pointer flex items-center justify-center"
                          onClick={() => copyText(item.site)}
                        >
                          <lord-icon
                            src="https://cdn.lordicon.com/iykgtsbt.json"
                            trigger="hover"
                            className="w-6 h-6"
                          ></lord-icon>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 break-words min-w-[100px] border-r-2 border-green-800">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate">{item.username}</span>
                        <div
                          className="cursor-pointer flex items-center justify-center"
                          onClick={() => copyText(item.username)}
                        >
                          <lord-icon
                            src="https://cdn.lordicon.com/iykgtsbt.json"
                            trigger="hover"
                            className="w-6 h-6"
                          ></lord-icon>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 break-words min-w-[100px] border-r-2 border-green-800">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate">
                          {"*".repeat(item.password.length)}
                        </span>
                        <div
                          className="cursor-pointer flex items-center justify-center"
                          onClick={() => copyText(item.password)}
                        >
                          <lord-icon
                            src="https://cdn.lordicon.com/iykgtsbt.json"
                            trigger="hover"
                            className="w-6 h-6"
                          ></lord-icon>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center ">
                      <div className="flex gap-2 justify-center">
                        <div
                          className="cursor-pointer flex items-center justify-center"
                          onClick={() => editPassword(item.id)}
                        >
                          <lord-icon
                            src="https://cdn.lordicon.com/gwlusjdu.json"
                            trigger="hover"
                            className="w-6 h-6"
                          ></lord-icon>
                        </div>
                        <div
                          className="cursor-pointer flex items-center justify-center"
                          onClick={() => deletePassword(item.id)}
                        >
                          <lord-icon
                            src="https://cdn.lordicon.com/skkahier.json"
                            trigger="hover"
                            className="w-6 h-6"
                          ></lord-icon>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
};

export default Manager;
