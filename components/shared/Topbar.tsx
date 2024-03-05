"use client";

import Image from "next/image";
import Link from "next/link";
import ProfileMenu from "./ProfileMenu";
import SearchBox from "./SearchBox";
import { useEffect, useState } from "react";
import { getCurrentUserProfile } from "@/utilities/storageUtils";
import Notifications from "./Notifications";

interface User {
  id: string;
  avatar: string;
  username: string;
}

const Topbar = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUserProfile());
  }, []);

  return (
    <nav className="topbar">
      <Link href="/" className="flex items-center gap-4">
        <Image src="/assets/logo.png" alt="logo" width={176} height={92} />
      </Link>

      <div className="flex flex-row">
        <div className="py-3 px-3">
          <SearchBox />
        </div>
        <Notifications currentUser={currentUser} />
        <div>
          <ProfileMenu />
        </div>
      </div>
    </nav>
  );
};

export default Topbar;
