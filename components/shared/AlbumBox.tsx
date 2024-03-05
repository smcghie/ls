import React, { useState, useEffect, useRef, useContext } from "react";
import Photo from "./Photo";
import { MapContext } from "@/contexts/MapContext";
import PhotoPopup from "./PhotoPopup";
import { getCurrentUserProfile } from "@/utilities/storageUtils";
import AddToAlbum from "./AddToAlbum";
import { useAlbumsContext } from "@/contexts/MomentsContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Image from "next/image";
import Link from "next/link";
import { Album, Moment } from "@/models/models";
import callApi from "@/utilities/api";
import { constructAvatarImageUrl } from "@/utilities/helpers";

interface AlbumBoxProps {
  album: Album;
  name: string;
  onAlbumClick: (name: string) => void;
  isSelected: boolean;
  openAlbum: string | null;
  setOpenAlbum: (id: string | null) => void;
  activePhoto: { albumId: string | null; photoId: string | null };
  setActivePhoto: (albumId: string | null, photoId: string | null) => void;
  toggleExpandedValue: (expanded: boolean) => void;
  onAlbumUpdate: (updatedAlbum: Album) => void;
}

interface User {
  id: string;
  avatar: string;
  name: string;
  username: string;
}

const AlbumBox: React.FC<AlbumBoxProps> = ({
  album,
  name,
  onAlbumClick,
  isSelected,
  openAlbum,
  setOpenAlbum,
  activePhoto,
  setActivePhoto,
  toggleExpandedValue,
  onAlbumUpdate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [albumView, setAlbumView] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [openMoment, setOpenMoment] = useState<Moment | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAddToAlbum, setShowAddToAlbum] = useState(false);
  const [commentIsOpen, setCommentIsOpen] = useState(false);
  const { fetchAlbumsData } = useAlbumsContext();
  const { setSelectedPoint } = useContext(MapContext);
  const [localAlbum, setLocalAlbum] = useState<Album>(album);
  const [isHovered, setIsHovered] = useState(false);
  const [isCurrentUserSharedUser, setIsCurrentUserSharedUser] = useState<
    boolean | null
  >(false);

  useEffect(() => {
    const profile = getCurrentUserProfile();
    setCurrentUser(profile);

    if (profile && localAlbum.sharedUsers) {
      const shared = localAlbum.sharedUsers.some(
        (sharedUser) => sharedUser.id === profile.id
      );
      setIsCurrentUserSharedUser(shared);
    }
  }, [localAlbum.sharedUsers, localAlbum, localAlbum.sharedUsers?.length]);

  useEffect(() => {
    setLocalAlbum(album);
  }, [album]);

  // useEffect(() => {
  //   console.log("LOCAL ALBUM: ", localAlbum);
  // }, [localAlbum]);

  function usePrevious(value: any) {
    const ref = useRef();
    useEffect(() => {
      ref.current = value;
    });
    return ref.current;
  }

  const prevEnlargedImage = usePrevious(enlargedImage);

  useEffect(() => {
    if (prevEnlargedImage && !enlargedImage) {
      toggleExpandedValue(false);
    }
  }, [enlargedImage, prevEnlargedImage]);

  const handleClick = () => {
    onAlbumClick(localAlbum.id);
  };

  const toggleAddToAlbum = () => {
    toggleExpandedValue(!showAddToAlbum);
    setShowAddToAlbum(!showAddToAlbum);
  };

  useEffect(() => {
    setCurrentUser(getCurrentUserProfile());
  }, []);

  const isCurrentUserAlbum =
    currentUser && localAlbum.createdById === currentUser.id;

  const handleOpenClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    setOpenAlbum(newIsOpen ? name : null);
    setAlbumView(newIsOpen);
  };

  const deleteAlbum = async () => {
    try {
      const res = await callApi(
        `${process.env.NEXT_PUBLIC_API_URL}/album/${localAlbum.id}`,
        {
          method: "DELETE",
        }
      );
      if (res) {
        fetchAlbumsData();
      } else {
        alert("Error deleting moment");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    if (openAlbum !== name && isOpen) {
      setIsOpen(false);
    }
  }, [openAlbum, name, isOpen]);

  const convertExifDateToReadable = (exifDate: string) => {
    if (!exifDate) {
      return "Date not available";
    }
    return new Date(exifDate).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      // hour: '2-digit',
      // minute: '2-digit',
      // second: '2-digit',
      timeZone: "UTC",
    });
  };

  const handlePhotoClick = (moment: string) => {
    setActivePhoto(name, moment);
  };

  const handleMomentUpdated = (updatedAlbum: any) => {
    setLocalAlbum(updatedAlbum);
    onAlbumUpdate(updatedAlbum);
  };

  return (
    <div className="flex-1 ml-2">
      <div
        //ref={albumBoxRef}
        onClick={handleClick}
      >
        <div className="flex flex-col">
          <div
            className={`${
              isSelected ? "bg-tb-2" : "bg-tb-1"
            } flex flex-row items-center justify-between`}
          >
            <div>
              <div className="flex">
                <button
                  onClick={(e) => {
                    handleClick();
                    handleOpenClick(e);
                  }}
                  className="expand-album-button max-md:hidden"
                >
                  <Image
                    src="/assets/folder.png"
                    alt="reply"
                    width={40}
                    height={40}
                    className="cursor-pointer object-contain opacity-75 hover:opacity-100 mr-3"
                  />
                </button>
                <div>
                  <div className="flex flex-row items-center">
                    <h2 className="text-body-bold font-bold text-light-1 pr-2">
                      {name}
                    </h2>
                    <p>-</p>
                    <h2 className="text-small-semibold italic font-bold text-light-1 pl-2">
                      {album.moments.length}&nbsp;moments
                    </h2>
                  </div>
                  <p className="text-small-regular italic text-gray-3">
                    {localAlbum.moments.length > 0 &&
                    localAlbum.moments[0].captureDate
                      ? `${convertExifDateToReadable(
                          localAlbum.moments[0].captureDate
                        )}-${convertExifDateToReadable(
                          localAlbum.moments[localAlbum.moments.length - 1]
                            .captureDate
                        )}`
                      : "No time data"}
                  </p>
                </div>
              </div>
            </div>

            {localAlbum &&
              name !== "All" &&
              (localAlbum.albumType === "Personal" ||
                localAlbum.albumType === "Trip") && (
                <Link href={`/profile/${localAlbum.moments[0].createdBy.id}`}>
                  <div
                    className="flex flex-row group"
                    onClick={(event) => {
                      event.stopPropagation();
                    }}
                  >
                    <div className="flex flex-col mr-2">
                      <p className="text-right text-base-semibold group-hover:text-gray-3">
                        {localAlbum.moments[0].createdBy.name}
                      </p>
                      <p className="text-gray-3 text-small-regular italic">
                        @{localAlbum.moments[0].createdBy.username}
                      </p>
                    </div>
                    <div className="relative flex h-11 w-11">
                      <img
                        src={constructAvatarImageUrl(
                          localAlbum.moments[0].createdBy.avatar
                        )}
                        alt="profile image"
                        className="rounded-full object-cover h-full w-full shadow-2xl border-2 border-tb-3 group-hover:border-opacity-50"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  </div>
                </Link>
              )}
            {localAlbum &&
              name !== "All" &&
              localAlbum.sharedUsers &&
              localAlbum.sharedUsers.length > 0 && (
                <div
                  className="relative"
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  <div
                    className="flex flex-row group"
                    onClick={(event) => {
                      event.stopPropagation();
                    }}
                  >
                    <div className="flex -space-x-4">
                      {[
                        localAlbum.createdBy,
                        ...localAlbum.sharedUsers.filter(Boolean),
                      ]
                        .filter(Boolean)
                        .slice(0, 3)
                        .map((user, index) => (
                          <div
                            key={user?.id || index}
                            className="relative flex h-11 w-11"
                          >
                            <img
                              src={constructAvatarImageUrl(
                                `${user?.avatar ?? "/default-avatar.png"}`
                              )}
                              alt={`${user?.name ?? "User"}'s avatar`}
                              className="rounded-full object-cover shadow-2xl border-2 border-tb-3 group-hover:border-opacity-50 z-10 w-full h-full"
                              style={{ objectFit: "cover", zIndex: 3 - index }}
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                  {isHovered && (
                    <div className="popup-container">
                      {[
                        localAlbum.createdBy,
                        ...localAlbum.sharedUsers.filter(Boolean),
                      ]
                        .filter(Boolean)
                        .map((user, index) => (
                          <Link
                            key={user?.id || index}
                            href={`/profile/${user?.id}`}
                          >
                            <p className="popup-item">
                              {" "}
                              @{user?.username ?? "User"}
                            </p>
                          </Link>
                        ))}
                    </div>
                  )}
                </div>
              )}
          </div>

          {isSelected && (
            <div className="flex items-center mt-1">
              {isSelected && (
                <div className="flex flex-grow justify-center">
                  <button
                    onClick={handleOpenClick}
                    className="expand-album-button"
                  >
                    <div className="relative flex h-6 w-12">
                      <Image
                        src="/assets/down-arrow.png"
                        alt="reply"
                        fill
                        className={`cursor-pointer object-fill opacity-75 hover:opacity-100 ${
                          isOpen ? "scale-y-[-1]" : ""
                        }`}
                      />
                    </div>
                  </button>
                </div>
              )}

              {isCurrentUserAlbum && (
                <AlertDialog>
                  <AlertDialogTrigger>
                    <div className="flex flex-row ml-auto">
                      <img
                        src="/assets/trash.png"
                        alt="Delete"
                        className="w-5 h-5 drop-shadow mr-2"
                      />
                    </div>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you sure you want to delete the album?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete this album from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={deleteAlbum}>
                        Continue
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          )}
        </div>
      </div>

      <div>
        <div
          className={`${
            isOpen ? "max-h-full" : "max-h-0"
          } transition-all duration-500 ease-in-out`}
        >
          <div className="max-md:flex max-md:overflow-x-auto md:grid md:grid-cols-auto-fill">
            {isOpen && (isCurrentUserAlbum || isCurrentUserSharedUser) && (
              <div className="pt-5 pl-2 pr-3">
                <button
                  className="add-to-album-button-container"
                  onClick={toggleAddToAlbum}
                >
                  <div className="add-button">+</div>
                  <div className="add-button-text">Add to Album</div>
                </button>

                {showAddToAlbum && (
                  <AddToAlbum
                    albumId={localAlbum.id}
                    onClose={toggleAddToAlbum}
                    onMomentAdded={handleMomentUpdated}
                  />
                )}
              </div>
            )}
            {isOpen &&
              localAlbum.moments.map((point) => (
                <div
                  key={point.id}
                  className="max-md:flex-none flex-none mt-3 ml-1 mr-1"
                >
                  <Photo
                    id={point.id}
                    src={point.image}
                    albumId={point.albumId}
                    comments={point.commentCount}
                    isCurrentUser={isCurrentUserAlbum}
                    onPhotoClick={() => {
                      setSelectedImage(point.image);
                      setSelectedPoint(point);
                      handlePhotoClick(point.image);
                    }}
                    onEnlargeClick={() => {
                      setCommentIsOpen(false);
                      setEnlargedImage(point.image);
                      setOpenMoment(point);
                      toggleExpandedValue(true);
                    }}
                    onCommentClick={() => {
                      setCommentIsOpen(true);
                      setEnlargedImage(point.image);
                      setOpenMoment(point);
                      toggleExpandedValue(true);
                    }}
                    onMomentDeleted={handleMomentUpdated}
                    isActive={activePhoto.photoId === point.image}
                  />
                </div>
              ))}
          </div>
        </div>
        <PhotoPopup
          enlargedImage={enlargedImage}
          setEnlargedImage={setEnlargedImage}
          moment={openMoment}
          album={localAlbum.moments}
          onNewPhotoSelected={setOpenMoment}
          isCommentsOpen={commentIsOpen}
        />
      </div>
    </div>
  );
};

export default AlbumBox;
