"use client";

import React, { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet";
import Image from "next/image";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useRouter } from "next/navigation";
import { getCurrentUserProfile } from "@/utilities/storageUtils";
import Link from "next/link";
import { sidebarLinks } from "@/constants";
import callApi from "@/utilities/api";
import { constructAvatarImageUrl } from "@/utilities/helpers";

interface User {
  id: string;
  avatar: string;
  name: string;
  username: string;
}

const ProfileMenu = () => {
  const router = useRouter();
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [friendsList, setFriendsList] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUserProfile());
  }, []);

  async function logout() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });

    if (res.ok) {
      //console.log(res)
      localStorage.removeItem("currentUser");
      localStorage.removeItem("currentUserProfile");
      router.push("/signin");
    } else {
      console.error("Failed to log out");
    }
  }

  async function fetchFriendsList(): Promise<User[]> {
    if (!currentUser) {
      console.log("currentUser not defined");
      return [];
    }

    try {
      const res = await callApi(
        `${process.env.NEXT_PUBLIC_API_URL}/friendship/${currentUser.id}/friends`,
        {
          method: "GET",
        }
      );
      const friends: User[] = res;
      //console.log("FRIENDS LIST: ", friends);
      return friends;
    } catch (error) {
      console.error("Failed to fetch friends list:", error);
      throw error;
    }
  }

  if (!currentUser) {
    return [];
  }

  return (
    <div>
      <Sheet>
        <SheetTrigger>
          <div className="md:hidden relative h-12 w-12 ">
            <Image
              src="/assets/menu.png"
              alt="menu icon"
              fill
              className=" close-shadow p-2 mt-3"
            />
          </div>
          <div className="hidden md:block relative h-16 w-16">
            <img
              src={constructAvatarImageUrl(currentUser.avatar)}
              alt="profile image"
              className="object-cover rounded-full shadow-2xl border-2 border-tb-3 h-full w-full"
              style={{ objectFit: "cover" }}
            />
          </div>
        </SheetTrigger>
        <SheetContent className="bg-dark-1 text-light-2 overflow-y-auto">
          <SheetHeader>
            <div className="flex flex-row pb-4">
              <div className="relative flex h-11 w-11">
                <img
                  src={constructAvatarImageUrl(currentUser.avatar)}
                  alt="profile image"
                  className="object-cover rounded-full shadow-2xl border-2 border-tb-3 h-full w-full"
                  style={{ objectFit: "cover" }}
                />
              </div>
              <div className="flex flex-col ml-2">
                <p className="text-left text-base-semibold">
                  {currentUser.name}
                </p>
                <p className="text-gray-3 text-small-regular italic">
                  @{currentUser.username}
                </p>
              </div>
            </div>
          </SheetHeader>
          <Accordion
            type="single"
            collapsible
            onValueChange={(value) => {
              setOpenItems(typeof value === "string" ? [value] : value);
              if (value.includes("friends") && friendsList.length === 0) {
                fetchFriendsList().then(setFriendsList);
              }
            }}
          >
            <AccordionItem value="friends">
              <AccordionTrigger>Friends</AccordionTrigger>
              <AccordionContent>
                {openItems.includes("friends") &&
                  friendsList.map((friend: User) => (
                    <Link key={friend.id} href={`/profile/${friend.id}`}>
                      <div className="flex flex-row items-center gap-2 cursor-pointer py-1">
                        <div className="relative h-12 w-12">
                          <img
                            src={constructAvatarImageUrl(friend.avatar)}
                            alt="profile image"
                            className="rounded-full object-cover shadow-2xl h-full w-full"
                            style={{ objectFit: "cover" }}
                          />
                        </div>
                        <span className="ml-2">{friend.name}</span>
                      </div>
                    </Link>
                  ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {sidebarLinks.map((link) => {
            const modifiedLinkRoute =
              link.route === "/profile" || link.route === "/activity"
                ? `${link.route}/${currentUser.id}`
                : link.route;

            return (
              <Link href={modifiedLinkRoute} key={link.label}>
                <div className="pt-6 flex flex-row text-light-1 hover:opacity-75">
                  <Image
                    src={link.imgURL}
                    alt={link.label}
                    width={24}
                    height={24}
                    className="mb-2"
                  />
                  <p className="ml-2 text-base-regular">{link.label}</p>
                </div>
              </Link>
            );
          })}

          <div className="pt-20 flex justify-end text-light-1">
            <button onClick={logout} className="text-black flex-row flex">
              <div className="relative h-8 w-8 mr-2 text-light-1">
                <Image
                  src="/assets/logout.png"
                  alt="profile image"
                  fill
                  className="object-cover"
                />
              </div>
              <p className="mt-1 text-light-2">Logout</p>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ProfileMenu;