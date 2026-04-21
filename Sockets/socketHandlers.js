import React, { useEffect, useState, useRef } from "react";
import { API } from "../Services/Api";
import { socket } from "../Services/Socket";
import themes from "../Utils/themes";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  FiArrowLeft,
  FiEdit,
  FiSave,
  FiX,
  FiUpload,
  FiPhone,
} from "react-icons/fi";

const ProfilePage = () => {
  const theme = themes.zynk;
  const navigate = useNavigate();
  const { userId } = useParams();
  const loggedInUser = useSelector((state) => state.auth.user);

  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", bio: "" });

  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const fileInputRef = useRef();

  const isOwnProfile = !userId || userId === loggedInUser?._id;
  const isOnline = onlineUsers.includes(user?._id);

  // ================= FETCH PROFILE =================
  const fetchProfile = async () => {
    try {
      const url = isOwnProfile ? "/api/users/me" : `/api/users/${userId}`;
      const res = await API.get(url);
      const data = res.data?.data;

      setUser(data);

      if (isOwnProfile) {
        setForm({
          name: data.name || "",
          phone: data.phone || "",
          bio: data.bio || "",
        });
      }

      setPreview(data.avatar?.url || null);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  // ================= SOCKET SETUP =================
  useEffect(() => {
    if (!loggedInUser?._id) return;

    socket.emit("setup", { _id: loggedInUser._id });

    const handleOnlineUsers = (users) => setOnlineUsers(users);

    socket.on("get_online_users", handleOnlineUsers);

    return () => {
      socket.off("get_online_users", handleOnlineUsers);
    };
  }, [loggedInUser?._id]);

  // ================= EDIT =================
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAvatarClick = () => {
    if (isOwnProfile && isEditing) fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAvatarFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await API.put("/api/users/me", form);
      setIsEditing(false);
      fetchProfile();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;

    const formData = new FormData();
    formData.append("avatar", avatarFile);

    try {
      await API.put("/api/users/me/avatar", formData);
      setAvatarFile(null);
      fetchProfile();
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return null;

  return (
    <div className={`${theme.pageGradient} min-h-screen p-6`}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <button
          onClick={() => navigate(-1)}
          className="text-white/80 hover:text-white text-xl mb-6"
        >
          <FiArrowLeft />
        </button>

        {/* PROFILE CARD */}
        <motion.div className="p-6 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 text-center">
          <div
            onClick={handleAvatarClick}
            className="relative mx-auto w-fit cursor-pointer"
          >
            <img
              src={preview || "https://i.pravatar.cc/150"}
              className="w-36 h-36 rounded-full object-cover border-4 border-indigo-500"
            />

            {isOwnProfile && isEditing && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white text-xs">
                Change
              </div>
            )}
          </div>

          <h2 className="text-3xl font-bold text-white mt-4">{user.name}</h2>
          <p className="text-slate-400">{user.email}</p>

          <p className="text-sm mt-1 text-slate-400">
            {isOnline ? "🟢 Online" : "⚪ Offline"}
          </p>

          <div className="mt-5 p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs text-slate-400 mb-1">Bio</p>
            <p className="text-sm text-white">
              {user.bio || "No bio available"}
            </p>
          </div>

          {user.phone && (
            <p className="text-slate-300 mt-3 flex justify-center items-center gap-2">
              <FiPhone /> {user.phone}
            </p>
          )}

          {isOwnProfile && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="mt-6 p-3 bg-indigo-500 rounded-xl"
            >
              <FiEdit />
            </button>
          )}
        </motion.div>

        {/* EDIT FORM */}
        {isOwnProfile && isEditing && (
          <form onSubmit={handleUpdate} className="mt-6 space-y-4">
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full p-3 rounded-xl bg-white/10 text-white"
            />

            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full p-3 rounded-xl bg-white/10 text-white"
            />

            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              className="w-full p-3 rounded-xl bg-white/10 text-white h-24"
            />

            <div className="flex gap-3">
              <button className="flex-1 py-3 bg-green-500 rounded-xl">
                <FiSave />
              </button>

              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-5 bg-gray-600 rounded-xl"
              >
                <FiX />
              </button>
            </div>

            {avatarFile && (
              <button
                type="button"
                onClick={handleAvatarUpload}
                className="w-full py-2 bg-purple-500 rounded-xl"
              >
                <FiUpload />
              </button>
            )}
          </form>
        )}

        {isOwnProfile && (
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            hidden
          />
        )}
      </motion.div>
    </div>
  );
};

export default ProfilePage;



