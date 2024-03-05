import Image from "next/image";
import Link from "next/link";
import io from "socket.io-client";
import { useEffect, useRef, useState } from "react";
import callApi from "@/utilities/api";
import PhotoPopup from "./PhotoPopup";
import { Moment } from "@/models/models";

interface Props {
  currentUser: User | null;
}

interface User {
  id: string;
  avatar: string;
  username: string;
}

interface Request {
  id: string;
  enlargedImage: string | null;
  moment: Moment | null;
  albumId: string | null;
  albumTitle: string | null;
  sender: {
    username: string;
    id: string;
    name: string;
  } | null;
  receiver: {
    username: string;
    id: string;
    name: string;
  } | null;
  status: string;
}

const Notifications = ({ currentUser }: Props) => {
  const [requests, setRequests] = useState<Request[] | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isPhotoPopupOpen, setIsPhotoPopupOpen] = useState(false);
  const requestsRef = useRef<HTMLDivElement>(null);
  const [requestStatusChange, setRequestStatusChange] = useState(false);

  const updateRequests = (newRequest: Request | Request[]) => {
    const existingRequests = JSON.parse(sessionStorage.getItem("requests") || "[]");
    //console.log("NEW: ", newRequest);
    //console.log("EXISTING: ", existingRequests);
  
    const newRequestsArray = Array.isArray(newRequest) ? newRequest : [newRequest];
  
    const uniqueNewRequests = newRequestsArray.filter(newReq =>
      !existingRequests.some((existingReq: Request) => existingReq.id === newReq.id));
  
    const updatedRequests = [...uniqueNewRequests, ...existingRequests];
    //console.log("UPDATED: ", updatedRequests);
  
    sessionStorage.setItem("requests", JSON.stringify(updatedRequests));
    setRequests(updatedRequests);
  };
  
  useEffect(() => {
    const storedRequests = sessionStorage.getItem("requests");
    if (storedRequests && storedRequests.length > 0) {
      setRequests(JSON.parse(storedRequests));
      //console.log("STORED REQ: ", JSON.parse(storedRequests));
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        requestsRef.current &&
        !requestsRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (currentUser) {
      const socket = io(
        process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000",
        {
          transports: ["websocket"],
          query: {
            userId: currentUser.id,
          },
        }
      );

      socket.on("friendRequestReceived", (data) => {
        //console.log("Friend request received:", data);
        updateRequests(data);
      });

      socket.on("friendRequestCancelled", (data) => {
        //console.log("Friend request cancelled:", data);
        setRequests((prevRequests) => {
          const validRequests = prevRequests || [];
          const updatedRequests = validRequests.filter(
            (request) => request.id !== data.id
          );
          sessionStorage.setItem("requests", JSON.stringify(updatedRequests));
          return updatedRequests;
        });
      });

      socket.on("friendRequestAccepted", (data) => {
        //console.log("Friend request received:", data);
        updateRequests(data);
      });

      socket.on("sharedAlbumNotification", (data) => {
        //console.log("Shared album:", data);
        updateRequests(data);
      });

      socket.on("newCommentNotification", (data) => {
        //console.log("New comment:", data);
        updateRequests(data);
      });

      return () => {
        socket.off("friendRequestReceived");
        socket.off("friendRequestCancelled");
        socket.off("friendRequestAccepted");
        socket.off("sharedAlbumNotification");
        socket.off("newCommentNotification");
        socket.disconnect();
      };
    }
  }, [currentUser]);

  useEffect(() => {
    fetchRequests();
  }, [requestStatusChange]);

  const acceptFriendship = async (friendshipId: string) => {
    try {
      const acceptFriendship = await callApi(
        `${process.env.NEXT_PUBLIC_API_URL}/friendship/accept-friend-request/${friendshipId}`,
        { method: "PUT" }
      );
      localStorage.setItem(
        "currentUserProfile",
        JSON.stringify(acceptFriendship)
      );
      setRequestStatusChange(!requestStatusChange);
      setRequests((prevRequests) => {
        const validRequests = prevRequests ?? [];
        const updatedRequests = validRequests.filter(
          (request) => request.id !== friendshipId
        );
        sessionStorage.setItem("requests", JSON.stringify(updatedRequests));
        return updatedRequests;
      });
    } catch (error) {
      console.error("Error accepting friend", error);
    }
  };

  const cancelFriendRequest = async (senderId: string) => {
    try {
      const res = await callApi(
        `${process.env.NEXT_PUBLIC_API_URL}/friendship/cancel-friend-request`,
        {
          method: "PUT",
          body: { senderId: senderId, receiverId: currentUser?.id },
        }
      );
      //console.log("CANCELLED REQUEST: ", JSON.stringify(res));
      setRequests((prevRequests) => {
        const validRequests = prevRequests ?? [];
        const updatedRequests = validRequests.filter(
          (req) => req.sender?.id !== senderId
        );
        sessionStorage.setItem("requests", JSON.stringify(updatedRequests));
        return updatedRequests;
      });
    } catch (error) {
      console.error("Error cancelling friend request:", error);
    }
  };

  const fetchRequests = async () => {
    try {
      const fetchedRequests = await callApi(
        `${process.env.NEXT_PUBLIC_API_URL}/friendship/pending-requests`,
        { method: "GET" }
      );
      //console.log("FETCHED REQUESTS:", fetchedRequests);
      if (fetchedRequests && fetchedRequests.length > 0) {
        updateRequests(fetchedRequests);
      }
    } catch (error) {
      console.error("Error fetching friend requests", error);
    }
  };

  const openPhotoPopup = () => setIsPhotoPopupOpen(true);
  const closePhotoPopup = () => setIsPhotoPopupOpen(false);

  return (
    <div ref={requestsRef}>
      <div className="flex flex-row">
        <div className="py-4 px-4">
          <button
            onClick={() => {
              setShowResults(!showResults);
            }}
          >
            <div className="relative h-8 w-8">
              <Image
                src="/assets/bell.png"
                alt="profile image"
                fill
                className="rounded-full object-cover shadow-2xl"
              />
              {requests && requests.length > 0 && (
                <div className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full border-2 border-white"></div>
              )}
            </div>
          </button>
        </div>
        <div className="parent-component" style={{ position: "relative" }}>
          {showResults && (
            <div
              className="results-container"
              style={{
                position: "absolute",
                top: 40,
                left: -305,
                zIndex: 1,
                width: "270px",
                maxHeight: "400px",
                overflowY: "auto",
                border: "1px solid white",
              }}
            >
              {requests === null && (
                <div className="bg-tb-4 p-2 text-light-1">
                  <p>No notifications.</p>
                </div>
              )}
              {requests &&
                requests.map((request, index) => (
                  <div
                    key={index}
                    className="bg-tb-4 p-2 text-light-1 no-focus outline-none resize-none flex flex-row"
                  >
                    <div className="flex flex-row w-full items-center gap-2 cursor-pointer ">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex justify-left items-center">
                          {(request.status === "pending" ||
                            request.status === "sharedAlbum" ||
                            request.status === "newComment") &&
                            request.sender && (
                              <Link href={`/profile/${request.sender.id}`}>
                                <p className="hover:text-gray-3">
                                  {request.sender.name}
                                </p>
                              </Link>
                            )}
                          {request.status === "accepted" &&
                            request.receiver && (
                              <Link href={`/profile/${request.receiver.id}`}>
                                <p>{request.receiver.name}</p>
                              </Link>
                            )}
                          {request.status === "pending" && request.sender && (
                            <p className="text-subtle-medium italic">
                              &nbsp;wants to be your friend!
                            </p>
                          )}
                          {request.status === "accepted" &&
                            request.receiver && (
                              <p className="text-subtle-medium italic">
                                &nbsp;accepted your friend request!
                              </p>
                            )}
                          {request.status === "newComment" &&
                            request.sender && (
                              <button
                                className="big-plus hover:text-gray-3"
                                onClick={() => {
                                  openPhotoPopup();
                                }}
                              >
                                <p className="text-subtle-medium italic">
                                  &nbsp;commented on album {request.albumTitle}!
                                </p>
                              </button>
                            )}
                          {isPhotoPopupOpen && (
                            <PhotoPopup
                              enlargedImage={request.enlargedImage}
                              setEnlargedImage={closePhotoPopup}
                              moment={request.moment}
                              album={[]}
                              onNewPhotoSelected={() => {}}
                              isCommentsOpen={true}
                            />
                          )}
                          {request.status === "sharedAlbum" &&
                            request.sender && (
                              <p className="text-subtle-medium italic">
                                &nbsp;shared album {request.albumTitle} with
                                you!
                              </p>
                            )}
                        </div>
                        {request.status === "pending" && (
                          <div className="flex flex-row">
                            <button
                              className="big-plus hover:text-gray-3"
                              onClick={() => {
                                acceptFriendship(request.id);
                              }}
                            >
                              <p className="text-subtle-semibold">
                                Accept&nbsp;
                              </p>
                            </button>
                            /
                            <button
                              className="big-plus hover:text-gray-3"
                              onClick={() => {
                                if (request.sender) {
                                  cancelFriendRequest(request.sender.id);
                                }
                              }}
                            >
                              <p className="text-subtle-semibold">
                                &nbsp;Reject
                              </p>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;