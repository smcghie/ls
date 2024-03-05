"use client"

import { sidebarLinks } from "@/constants";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getCurrentUserProfile } from "@/utilities/storageUtils";

interface User {
  id: string
  username: string;
  avatar: string;
}
const LeftSidebar = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
      setCurrentUser(getCurrentUserProfile());
    }, [])

if(!currentUser){
  return;
}

return (
  <section className="custom-scrollbar leftsidebar">
    <div className="flex w-full flex-1 flex-col px-4">
      {sidebarLinks.map((link) => {
        const modifiedLinkRoute = link.route === '/profile' || link.route === '/activity' 
          ? `${link.route}/${currentUser.id}` 
          : link.route;

        return (
          <Link
            href={modifiedLinkRoute}
            key={link.label}
            className="group relative flex flex-col items-center justify-center mt-4 h-16 w-20 p-2 pb-8 rounded hover:bg-tb-3 hover:bg-opacity-50 transition-colors duration-300"
          >
            <Image
              src={link.imgURL}
              alt={link.label}
              width={24}
              height={24} 
              className="mb-2"  
            />
            <p className="absolute bottom-1 text-subtle-medium text-light-1 text-center max-lg:hidden group-hover:block hidden">{link.label}</p>
          </Link>
        );
      })}
    </div>
  </section>
)



}

export default LeftSidebar