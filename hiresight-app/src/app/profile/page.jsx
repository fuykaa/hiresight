"use client";

import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, User, Mail, Save, Edit2, Loader2, Camera } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import api from "@/lib/api";

export default function ProfilePage() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [avatarURL, setAvatarURL] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  const [userData, setUserData] = useState({
    fullName: "",
    email: "",
  });
  const [editName, setEditName] = useState("");

  const loadAvatar = async () => {
    try {
      const res = await api.get("/api/profile/avatar", { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      setAvatarURL((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } catch {
      setAvatarURL(null);
    }
  };

  useEffect(() => {
    api
      .get("/api/profile")
      .then((res) => {
        setUserData({
          fullName: res.data.full_name || "",
          email: res.data.email || "",
        });
        setEditName(res.data.full_name || "");
      })
      .catch(() => setError("Gagal memuat profil."))
      .finally(() => setLoading(false));

    loadAvatar();
  }, []);

  useEffect(() => {
    return () => {
      if (avatarURL) URL.revokeObjectURL(avatarURL);
    };
  }, [avatarURL]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("avatar", file);
    setUploadingAvatar(true);
    setError("");
    setSuccessMsg("");
    try {
      await api.put("/api/profile/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await loadAvatar();
      setSuccessMsg("Foto profil berhasil diperbarui.");
    } catch {
      setError("Gagal mengupload foto. Pastikan file jpg/png dan ukuran wajar.");
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const handleEdit = () => {
    setEditName(userData.fullName);
    setSuccessMsg("");
    setError("");
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError("");
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await api.put("/api/profile", { full_name: editName });
      setUserData((prev) => ({ ...prev, fullName: editName }));
      setSuccessMsg("Profil berhasil diperbarui.");
      setIsEditing(false);
    } catch {
      setError("Gagal menyimpan perubahan.");
    } finally {
      setSaving(false);
    }
  };

  const initials = userData.fullName
    ? userData.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div className="min-h-screen bg-background text-foreground font-montserrat p-6 pt-24 md:p-12 md:pt-32">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-bold mb-8 group bg-transparent border-none cursor-pointer"
        >
          <ArrowLeft
            size={20}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Back
        </button>

        <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[500px]">
          {/* Left Section: Avatar */}
          <div className="w-full md:w-1/3 bg-muted/30 p-6 md:p-12 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-border space-y-6">
            <div className="relative group">
              <Avatar className="w-28 h-28 md:w-40 md:h-40 border-4 border-background shadow-xl">
                {avatarURL && <AvatarImage src={avatarURL} alt="Foto profil" />}
                <AvatarFallback className="bg-primary/10 text-primary text-2xl md:text-4xl font-bold">
                  {loading ? <Loader2 className="animate-spin" /> : initials}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {uploadingAvatar ? (
                  <Loader2 size={28} className="text-white animate-spin" />
                ) : (
                  <Camera size={28} className="text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight">
                {loading ? (
                  <span className="text-muted-foreground text-base">Memuat...</span>
                ) : (
                  userData.fullName || <span className="text-muted-foreground text-base italic">Belum ada nama</span>
                )}
              </h2>
            </div>
          </div>

          {/* Right Section: Account Information */}
          <div className="flex-1 p-8 md:p-12 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold uppercase tracking-wider text-primary">
                Account Information
              </h3>
              {!isEditing && !loading && (
                <Button
                  onClick={handleEdit}
                  variant="outline"
                  className="rounded-xl gap-2 font-bold"
                >
                  <Edit2 size={16} /> Edit Profile
                </Button>
              )}
            </div>

            <div className="space-y-6 flex-1">
              {/* Full Name Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="fullName"
                  className="text-xs uppercase tracking-widest font-bold opacity-70"
                >
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    disabled={!isEditing || saving}
                    value={isEditing ? editName : userData.fullName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder={loading ? "Memuat..." : "Belum diisi"}
                    className="pl-10 h-12 rounded-xl bg-muted/20 border-border focus:ring-primary disabled:opacity-100 disabled:bg-transparent"
                  />
                </div>
              </div>

              {/* Email Field (read-only) */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-xs uppercase tracking-widest font-bold opacity-70"
                >
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    disabled
                    value={userData.email}
                    placeholder={loading ? "Memuat..." : ""}
                    suppressHydrationWarning
                    className="pl-10 h-12 rounded-xl bg-muted/20 border-border disabled:opacity-100 disabled:bg-transparent"
                  />
                </div>
                {isEditing && (
                  <p className="text-xs text-muted-foreground">
                    Email tidak dapat diubah.
                  </p>
                )}
              </div>

              {successMsg && (
                <p className="text-sm text-green-600 font-medium">{successMsg}</p>
              )}
              {error && (
                <p className="text-sm text-destructive font-medium">{error}</p>
              )}
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="pt-8 flex gap-4 mt-auto">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 h-12 rounded-xl font-bold gap-2 shadow-lg shadow-primary/20"
                >
                  {saving ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                  {saving ? "Menyimpan..." : "Save Changes"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex-1 h-12 rounded-xl font-bold"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
