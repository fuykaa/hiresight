"use client";

import React, { useState } from "react";
import { ArrowLeft, User, Mail, Camera, Save, Edit2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    fullName: "Alex Doe",
    email: "alex.doe@example.com",
    avatar: "https://github.com/shadcn.png",
  });

  const handleSave = () => {
    setIsEditing(false);
    // Logika simpan ke database bisa ditaruh di sini
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-montserrat p-6 md:p-12 md:pt-32">
      <div className="max-w-5xl mx-auto">
        {/* --- BACK BUTTON --- */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-bold mb-8 group"
        >
          <ArrowLeft
            size={20}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Back to Dashboard
        </Link>

        <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[500px]">
          {/* --- LEFT SECTION: AVATAR --- */}
          <div className="w-full md:w-1/3 bg-muted/30 p-12 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-border space-y-6">
            <div className="relative group">
              <Avatar className="w-40 h-40 border-4 border-background shadow-xl">
                <AvatarImage src={userData.avatar} />
                <AvatarFallback className="bg-primary/10 text-primary text-4xl font-bold">
                  {userData.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>

              {isEditing && (
                <button className="absolute bottom-2 right-2 p-3 bg-primary text-primary-content rounded-full shadow-lg hover:scale-110 transition-transform">
                  <Camera size={20} />
                </button>
              )}
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight">
                {userData.fullName}
              </h2>
            </div>
          </div>

          {/* --- RIGHT SECTION: ACCOUNT INFORMATION --- */}
          <div className="flex-1 p-8 md:p-12 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold uppercase tracking-wider text-primary">
                Account Information
              </h3>
              {!isEditing && (
                <Button
                  onClick={() => setIsEditing(true)}
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
                    disabled={!isEditing}
                    value={userData.fullName}
                    onChange={(e) =>
                      setUserData({ ...userData, fullName: e.target.value })
                    }
                    className="pl-10 h-12 rounded-xl bg-muted/20 border-border focus:ring-primary disabled:opacity-100 disabled:bg-transparent"
                  />
                </div>
              </div>

              {/* Email Field */}
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
                    disabled={!isEditing}
                    value={userData.email}
                    onChange={(e) =>
                      setUserData({ ...userData, email: e.target.value })
                    }
                    suppressHydrationWarning
                    className="pl-10 h-12 rounded-xl bg-muted/20 border-border focus:ring-primary disabled:opacity-100 disabled:bg-transparent"
                  />
                </div>
              </div>

              {/* Info Text (Hanya muncul saat edit) */}
              {isEditing && (
                <p className="text-xs text-muted-foreground italic pt-2">
                  * Nama dan email akan digunakan pada dokumen resume yang Anda
                  buat.
                </p>
              )}
            </div>

            {/* --- ACTION BUTTONS --- */}
            {isEditing && (
              <div className="pt-8 flex gap-4 mt-auto">
                <Button
                  onClick={handleSave}
                  className="flex-1 h-12 rounded-xl font-bold gap-2 shadow-lg shadow-primary/20"
                >
                  <Save size={18} /> Save Changes
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setIsEditing(false)}
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
