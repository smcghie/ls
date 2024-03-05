"use client"
import { getCurrentUserProfile } from "@/utilities/storageUtils";
import Image from "next/image";
import { useEffect, useState } from "react";
import ProfileMenu from "./ProfileMenu";
import Notifications from "./Notifications";
import { User } from "@/models/models";

function HomeHeader({}) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUserProfile());
  }, []);

  return (
    <div className='max-md:absolute max-md:top-0 max-md:left-0 max-md:z-10 max-md:bg-black max-md:bg-opacity-40 flex w-full flex-col justify-start md:hidden'>
      <div className="flex justify-between">
      <div className='flex items-center gap-3 p-1'>

          <Image
            src="/assets/logo.png"
            alt='profile image'
            width={124} 
            height={65}
            className='shadow-2xl'
          />
  
      </div>
      <div className="flex flex-row">
      <div className="md:hidden max-md:pt-2">
            <Notifications currentUser={currentUser} />
        </div>
      <div className="p-2 md:hidden">
        <ProfileMenu />
      </div>
      </div>
      </div>
    </div>
  );
}

export default HomeHeader;